import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { buildPersonalizedContext } from "@/lib/ai-context";

export async function POST(req) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

  const { messages } = await req.json();

  // Jedno efektywne zapytanie do bazy
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      measurements: { take: 10, orderBy: { createdAt: "desc" } },
      dailyCheckins: { take: 30, orderBy: { date: "desc" } },
    },
  });

  // Autorska funkcja budująca pełny, zoptymalizowany kontekst dla GPT-4o
  const context = user
    ? buildPersonalizedContext(user)
    : "Brak danych profilowych.";

  const systemPrompt = `
Jesteś Agent Zdrowie – empatycznym asystentem zdrowia opartym na GPT-4o.
• Udzielasz wyłącznie porad edukacyjnych i profilaktycznych.
• Nigdy nie stawiasz diagnozy medycznej.
• Przy objawach alarmowych (ból w klatce piersiowej, duszność, glukoza >300 mg/dL) – natychmiast zalecaj kontakt z 112.
• Zawsze odwołuj się do indywidualnych norm pacjenta podanych poniżej.
• Najnowszy pomiar jest najważniejszy.

AKTUALNY KONTEKST PACJENTA:
${context}
`.trim();

  const result = await streamText({
    model: openai("gpt-4o"),
    temperature: 0.3,
    system: systemPrompt,
    messages,
  });

  return result.toDataStreamResponse();
}
