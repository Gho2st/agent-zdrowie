import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = session.user.email;
    const { messages } = await req.json();

    let contextData = "Brak danych użytkownika.";

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        measurements: {
          orderBy: [
            { createdAt: "desc" },
            { id: "desc" }, // lub updatedAt
          ],
          take: 10,
        },
      },
    });

    if (user) {
      const {
        age,
        gender,
        height,
        weight,
        medications,
        systolicMin,
        systolicMax,
        diastolicMin,
        diastolicMax,
        glucoseFastingMin,
        glucoseFastingMax,
        glucosePostMealMax,
        bmi,
        weightMin,
        weightMax,
      } = user;

      const healthInfo = [
        age ? `Wiek: ${age} lat` : null,
        gender ? `Płeć: ${gender === "M" ? "mężczyzna" : "kobieta"}` : null,
        height ? `Wzrost: ${height} cm` : null,
        weight ? `Waga: ${weight} kg` : null,
        medications ? `Leki: ${medications}` : null, // 🔹 dodane
        bmi ? `BMI: ${bmi}` : null,
        systolicMin && systolicMax
          ? `Normy ciśnienia skurczowego: ${systolicMin}–${systolicMax} mmHg`
          : null,
        diastolicMin && diastolicMax
          ? `Normy ciśnienia rozkurczowego: ${diastolicMin}–${diastolicMax} mmHg`
          : null,
        glucoseFastingMin && glucoseFastingMax
          ? `Glukoza na czczo: ${glucoseFastingMin}–${glucoseFastingMax} mg/dL`
          : null,
        glucosePostMealMax
          ? `Glukoza po posiłku (2h): max ${glucosePostMealMax} mg/dL`
          : null,
        weightMin && weightMax
          ? `Zakres zdrowej wagi: ${weightMin}–${weightMax} kg`
          : null,
      ]
        .filter(Boolean)
        .join("\n");

      const measurementInfo = user.measurements
        .map((m) => {
          const date = new Date(m.createdAt).toLocaleString("pl-PL", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
          if (m.type === "ciśnienie") {
            return `${date} – Ciśnienie: ${m.systolic}/${m.diastolic} ${m.unit}`;
          } else {
            return `${date} – ${m.type}: ${m.amount} ${m.unit}`;
          }
        })
        .join("\n");

      contextData = `📌 Dane użytkownika:\n${healthInfo}\n\n📈 Ostatnie pomiary:\n${measurementInfo}`;
    }

    console.log(contextData);

    const result = await streamText({
      model: openai("gpt-4o"),
      system: `Jesteś cyfrowym asystentem zdrowia Agent Zdrowie. Pomóż użytkownikowi na podstawie poniższych danych:\n${contextData}\n\nOdpowiadaj jasno, krótko i empatycznie.`,
      messages,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("❌ Błąd generowania odpowiedzi:", error);
    return new Response(JSON.stringify({ error: "Wewnętrzny błąd serwera" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
