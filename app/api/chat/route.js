import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { buildPersonalizedContext } from "@/lib/ai-context";

// Opcjonalnie: Ustawienie maksymalnego czasu trwania funkcji (dla Vercel)
export const maxDuration = 30;

export async function POST(req) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

  const { messages } = await req.json();

  // 1. Pobranie danych z uwzględnieniem nowej, zagnieżdżonej struktury
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      measurements: {
        take: 20, // Zwiększamy liczbę pomiarów dla lepszego kontekstu
        orderBy: { createdAt: "desc" },
      },
      dailyCheckins: {
        take: 10,
        orderBy: { date: "desc" },
      },
      // ZMIANA: Pobieramy profil zdrowotny wraz z normami i chorobami
      healthProfile: {
        include: {
          norms: true,
          conditions: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Nie znaleziono użytkownika" },
      { status: 404 }
    );
  }

  // 2. Przygotowanie danych dla buildPersonalizedContext
  // Musimy "spłaszczyć" strukturę HealthProfile, aby helper (lib/ai-context)
  // otrzymał dane w formacie, którego się spodziewa.

  const profile = user.healthProfile || {};
  const norms = profile.norms || {};

  // Konwersja tablicy obiektów [{name: "cukrzyca"}] na string "cukrzyca"
  const conditionsString = profile.conditions
    ? profile.conditions.map((c) => c.name).join(", ")
    : "Brak zdiagnozowanych chorób";

  // Tworzymy "Wirtualnego Usera" dla kontekstu AI
  // Łączymy dane z tabeli User, HealthProfile i HealthNorms w jeden płaski obiekt
  const contextData = {
    name: user.name,
    email: user.email,
    measurements: user.measurements,
    dailyCheckins: user.dailyCheckins,

    // Dane z HealthProfile
    birthdate: profile.birthdate,
    gender: profile.gender, // Enum: MALE / FEMALE
    height: profile.height,
    weight: profile.weight,
    activityLevel: profile.activityLevel,
    medications: profile.medications,

    // Spłaszczone choroby
    conditions: conditionsString,

    // Normy (rozpakowujemy je, aby były dostępne jako np. user.systolicMax)
    ...norms,
  };

  // 3. Budowanie kontekstu
  const context = buildPersonalizedContext(contextData);

  // 4. Prompt Systemowy
  const systemPrompt = `
Jesteś Agent Zdrowie – empatycznym asystentem zdrowia opartym na GPT-4o.
• Udzielasz wyłącznie porad edukacyjnych i profilaktycznych.
• Nigdy nie stawiasz diagnozy medycznej.
• Przy objawach alarmowych (ból w klatce piersiowej, duszność, nagły silny ból głowy, glukoza >300 mg/dL) – natychmiast zalecaj kontakt z 112.
• Zawsze odwołuj się do indywidualnych norm pacjenta podanych poniżej (jeśli są dostępne).
• Analizując pomiary, bierz pod uwagę jednostki i trendy.
• Płeć pacjenta (z bazy): ${
    profile.gender === "MALE"
      ? "Mężczyzna"
      : profile.gender === "FEMALE"
      ? "Kobieta"
      : "Nie podano"
  }.

AKTUALNY KONTEKST PACJENTA:
${context}
`.trim();

  // 5. Strumieniowanie odpowiedzi
  const result = await streamText({
    model: openai("gpt-4o"),
    temperature: 0.3,
    system: systemPrompt,
    messages,
  });

  return result.toDataStreamResponse();
}
