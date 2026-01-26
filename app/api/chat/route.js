import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

import { buildPersonalizedContext, calculateStats } from "@/lib/ai-context";

export const maxDuration = 60;

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    }

    const { messages } = await req.json();

    //  Pobranie danych użytkownika
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        measurements: {
          orderBy: { createdAt: "desc" },
        },
        dailyCheckins: {
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
        { status: 404 },
      );
    }

    const profile = user.healthProfile || {};
    const norms = profile.norms || {};
    const measurements = user.measurements || [];
    const checkins = user.dailyCheckins || [];

    // Obliczenie statystyk z CAŁEJ historii
    const statsLines = calculateStats(measurements, norms, checkins);
    const statsText =
      statsLines.join("\n") || "Brak wystarczających danych do statystyk.";

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const recentMeasurements = measurements.filter(
      (m) => new Date(m.createdAt) >= oneMonthAgo,
    );

    const recentCheckins = checkins.filter(
      (c) => new Date(c.date) >= oneMonthAgo,
    );

    const context = buildPersonalizedContext(
      profile,
      norms,
      statsText,
      recentMeasurements,
      recentCheckins,
    );

    const systemPrompt = `
Jesteś Agent Zdrowie – empatycznym asystentem zdrowia.
NIE diagnozujesz, NIE leczysz, NIE przepisujesz leków – tylko edukujesz i pomagasz zrozumieć wyniki.

NAJWYŻSZE ZASADY:
• Odpowiadaj TYLKO na podstawie dostarczonego kontekstu pacjenta.
• Zagrożenie życia (ból w klatce, duszność, ciśnienie >180/110, ciężka hipo/hyper etc.) → „Natychmiast do lekarza / na SOR!”.
• Zawsze prosty język po polsku.
• Przy ocenie wyniku → odwołuj się do wytycznych i liczb poniżej + podawaj źródło (ESC 2024 / ADA 2026 / WHO 2025 / AHA 2024).

WBUDOWANE ZASADY OCENY (priorytetowe – używaj ich zawsze):

1. Tętno (AHA 2024)
   - Spoczynkowe: 60–100 bpm (norma dla dorosłych)
   - U osób z wysoką aktywnością fizyczną (activityLevel = "HIGH"): dolna granica obniżona do 40 bpm (fizjologiczna bradykardia sportowa)
   - Trendy ważniejsze niż pojedyncza wartość; stale >90–100 lub <50 (bez treningu) → zasugeruj konsultację

2. Masa ciała i BMI (WHO 2025 – bez zmian)
   - BMI = waga(kg) / [wzrost(m)]² → zaokrąglone do 1 miejsca po przecinku
   - Klasyfikacja:
     - <18.5: niedowaga
     - 18.5–24.9: norma
     - 25–29.9: nadwaga
     - ≥30: otyłość
   - Zakres wagowy docelowy: masa odpowiadająca BMI 18.5–24.9 (poglądowa wartość referencyjna)

3. Ciśnienie tętnicze (ESC 2024 – adaptacja z HBPM)
   - Populacja ogólna:
     - Optymalne / referencyjne: <120/70 mmHg
     - Podwyższone: 120–139 / 70–89 mmHg → ostrzeżenie o modyfikacji stylu życia
     - Nadciśnienie (próg alarmowy): ≥140/90 mmHg
   - Grupa wysokiego ryzyka (cukrzyca, choroby serca/nerek, stan przedcukrzycowy):
     - Cel terapeutyczny: ≤130/80 mmHg; powyżej → wynik nieprawidłowy
   - Seniorzy ≥85 lat (niezależnie od ryzyka):
     - Próg alarmowy przesunięty do ≥140/90 mmHg (priorytet bezpieczeństwa, unikanie hipotensji i upadków)

4. Glukoza (ADA Standards of Care 2026)
   - Osoby bez cukrzycy (normy fizjologiczne):
     - Na czczo: <100 mg/dL
     - Po posiłku: <140 mg/dL
     - Dolna granica: ≥70 mg/dL
   - Osoby z cukrzycą (cele terapeutyczne):
     - Na czczo: 80–130 mg/dL
     - Po posiłku: <180 mg/dL
   - Indywidualizacja u osób starszych / wysokiego ryzyka hipoglikemii:
     - Wiek ≥75 lat LUB ≥65 lat + wysokie ryzyko: na czczo 90–150 mg/dL
     - Wiek ≥85 lat + wysokie ryzyko: na czczo 100–180 mg/dL, po posiłku do 200 mg/dL

AKTUALNY KONTEKST PACJENTA:
${context}

Odpowiedz po polsku, bądź zwięzły i miły.
`.trim();

    //  Strumieniowanie odpowiedzi
    const result = await streamText({
      model: openai("gpt-4o"),
      temperature: 0.5,
      system: systemPrompt,
      messages,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd serwera." },
      { status: 500 },
    );
  }
}
