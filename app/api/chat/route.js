import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { buildPersonalizedContext } from "@/lib/ai-context";

export const maxDuration = 30;

export async function POST(req) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

  const { messages } = await req.json();

  // 1. Pobranie danych użytkownika
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      measurements: {
        take: 20,
        orderBy: { createdAt: "desc" },
      },
      dailyCheckins: {
        take: 10,
        orderBy: { date: "desc" },
      },
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

  // 2. Przygotowanie spłaszczonego obiektu dla buildPersonalizedContext
  const profile = user.healthProfile || {};
  const norms = profile.norms || {};

  // Główne choroby z flag boolean
  const mainConditions = [];
  if (profile.hasDiabetes) mainConditions.push("cukrzyca");
  if (profile.hasPrediabetes) mainConditions.push("stan przedcukrzycowy");
  if (profile.hasHypertension) mainConditions.push("nadciśnienie tętnicze");
  if (profile.hasHeartDisease)
    mainConditions.push("choroby sercowo-naczyniowe");
  if (profile.hasKidneyDisease) mainConditions.push("przewlekła choroba nerek");

  // Dodatkowe choroby z relacji conditions
  const additionalConditions = profile.conditions
    ? profile.conditions.map((c) => c.name).join(", ")
    : "";

  // Łączymy wszystko
  const allConditionsArray = [...mainConditions];
  if (additionalConditions) {
    allConditionsArray.push(additionalConditions);
  }

  const conditionsString =
    allConditionsArray.length > 0
      ? allConditionsArray.join(", ")
      : "Brak zdiagnozowanych chorób";

  // Spłaszczony obiekt przekazywany do buildPersonalizedContext
  const contextData = {
    name: user.name,
    email: user.email,
    measurements: user.measurements || [],
    dailyCheckins: user.dailyCheckins || [],

    // Podstawowe dane
    birthdate: profile.birthdate,
    gender: profile.gender,
    height: profile.height,
    weight: profile.weight,
    activityLevel: profile.activityLevel,
    medications: profile.medications,

    // Kluczowe flagi boolean – niezbędne dla precyzyjnej logiki AI
    hasDiabetes: profile.hasDiabetes ?? false,
    hasPrediabetes: profile.hasPrediabetes ?? false,
    hasHypertension: profile.hasHypertension ?? false,
    hasHeartDisease: profile.hasHeartDisease ?? false,
    hasKidneyDisease: profile.hasKidneyDisease ?? false,

    // Czytelny opis chorób (do wyświetlenia w kontekście)
    conditions: conditionsString,

    // Rozpakowane normy zdrowotne
    ...norms,
  };

  // 3. Budowanie kontekstu (używa nowej wersji funkcji)
  const context = buildPersonalizedContext(contextData);

  // 4. System prompt
  const systemPrompt = `
Jesteś Agent Zdrowie – empatycznym, profesjonalnym asystentem zdrowia opartym na GPT-4o.
• Udzielasz wyłącznie porad edukacyjnych, profilaktycznych i ogólnych zaleceń prozdrowotnych.
• Nigdy nie stawiasz diagnozy medycznej ani nie sugerujesz zmiany leczenia bez konsultacji z lekarzem.
• W stanach alarmowych (np. ból w klatce, duszność, glukoza >300 mg/dL lub <50 mg/dL, nagły silny ból głowy) – natychmiast zalecaj wezwanie pogotowia (112).
• Zawsze odwołuj się do indywidualnych norm pacjenta z sekcji "Normy" poniżej.
• Bierz pod uwagę kontekst kliniczny (cukrzyca, nadciśnienie itp.) przy analizie pomiarów.
• Płeć pacjenta: ${
    profile.gender === "MALE"
      ? "mężczyzna"
      : profile.gender === "FEMALE"
      ? "kobieta"
      : "nie podano"
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
