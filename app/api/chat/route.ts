import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = session.user.email;
    const { messages } = await req.json();

    let contextData = "Brak danych użytkownika.";

    const user = (await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        measurements: {
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: 10,
        },
        dailyCheckins: {
          orderBy: { date: "desc" },
          take: 30,
        },
      },
    })) as Prisma.UserGetPayload<{
      include: {
        measurements: true;
        dailyCheckins: true;
      };
    }>;

    if (user) {
      const {
        birthdate,
        gender,
        height,
        weight,
        medications,
        conditions,
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
        birthdate
          ? `Data urodzenia: ${birthdate.toISOString().split("T")[0]}`
          : null,
        gender ? `Płeć: ${gender === "M" ? "mężczyzna" : "kobieta"}` : null,
        height ? `Wzrost: ${height} cm` : null,
        weight ? `Waga: ${weight} kg` : null,
        medications ? `Leki: ${medications}` : null,
        conditions ? `Choroby: ${conditions}` : null,
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

          const base =
            m.type === "ciśnienie"
              ? `${date} – Ciśnienie: ${m.systolic}/${m.diastolic} ${m.unit}`
              : `${date} – ${m.type}: ${m.amount} ${m.unit}`;

          const note = m.context ? `\n   • Kontekst: ${m.context}` : "";

          return `${base}${note}`;
        })
        .join("\n");

      const checkinInfo = user.dailyCheckins
        .map((c) => {
          const date = new Date(c.date).toLocaleDateString("pl-PL");
          return [
            `📅 ${date}`,
            c.mood ? `• Samopoczucie: ${c.mood}` : null,
            c.sleep ? `• Sen: ${c.sleep}` : null,
            c.energy ? `• Energia: ${c.energy}` : null,
            c.stress ? `• Stres: ${c.stress}` : null,
          ]
            .filter(Boolean)
            .join("\n");
        })
        .join("\n\n");

      contextData = `📌 Dane użytkownika:\n${healthInfo}\n\n📈 Ostatnie pomiary:\n${measurementInfo}\n\n🧠 Historia samopoczucia:\n${checkinInfo}`;
    }

    console.log(contextData);

    const result = await streamText({
      model: openai("gpt-4o"),
      system: `Jesteś cyfrowym asystentem zdrowia Agent Zdrowie. Na podstawie danych użytkownika wygeneruj trafną, krótką i empatyczną poradę zdrowotną. Uwzględnij kontekst z ostatnich pomiarów i wpisów o samopoczuciu.\n\n${contextData}`,
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
