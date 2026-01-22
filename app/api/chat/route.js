import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

// Importujemy wspólne funkcje z Twojej biblioteki
import { buildPersonalizedContext, calculateStats } from "@/lib/ai-context";

export const maxDuration = 30;

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
    // AI dostanie informację np. "Średnia roczna: 120/80", co daje świetny punkt odniesienia.
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

    // System prompt
    const systemPrompt = `
Jesteś Agent Zdrowie – empatycznym asystentem zdrowia.
Twoim celem jest edukacja i wsparcie w interpretacji wyników, ale NIE leczenie.

ZASADY:
• Bazuj na dostarczonych danych ("AKTUALNY KONTEKST PACJENTA").
• Jeśli brakuje danych w sekcji "SZCZEGÓŁOWE POMIARY" (czyli w ostatnim miesiącu), powiedz o tym wprost i nie zgaduj bieżącego stanu.
• W sytuacjach zagrożenia (ból w klatce, duszność) odsyłaj do lekarza/na SOR.
• Bądź zwięzły, miły i konkretny.

AKTUALNY KONTEKST PACJENTA:
${context}
`.trim();

    console.log(systemPrompt);

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
