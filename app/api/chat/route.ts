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
      return NextResponse.json(
        { error: "Nieautoryzowany dostęp" },
        { status: 401 }
      );
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
        activityLevel,
        medications,
        conditions,
        pregnancy,
        systolicMin,
        systolicMax,
        diastolicMin,
        diastolicMax,
        glucoseFastingMin,
        glucoseFastingMax,
        glucosePrediabetesFastingMin,
        glucosePrediabetesFastingMax,
        glucosePostMealMax,
        weightMin,
        weightMax,
        pulseMin,
        pulseMax,
        bmi,
      } = user;

      const healthInfo = [
        birthdate
          ? `Wiek: ${
              new Date().getFullYear() - new Date(birthdate).getFullYear()
            } lat`
          : null,
        gender ? `Płeć: ${gender === "M" ? "mężczyzna" : "kobieta"}` : null,
        height ? `Wzrost: ${height} cm` : null,
        weight ? `Waga: ${weight} kg` : null,
        activityLevel ? `Poziom aktywności: ${activityLevel}` : null,
        medications ? `Leki: ${medications}` : null,
        conditions ? `Stan zdrowia, choroby: ${conditions}` : null,
        gender === "K" && pregnancy !== undefined
          ? `Ciąża: ${pregnancy ? "Tak" : "Nie"}`
          : null,
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
        glucosePrediabetesFastingMin && glucosePrediabetesFastingMax
          ? `Glukoza przedcukrzycowa: ${glucosePrediabetesFastingMin}–${glucosePrediabetesFastingMax} mg/dL`
          : null,
        glucosePostMealMax
          ? `Glukoza po posiłku (2h): max ${glucosePostMealMax} mg/dL`
          : null,
        conditions?.includes("cukrzyca")
          ? `Glukoza po posiłku (dla cukrzyków): max 180 mg/dL`
          : null,
        weightMin && weightMax
          ? `Zakres zdrowej wagi: ${weightMin}–${weightMax} kg`
          : null,
        pulseMin && pulseMax
          ? `Tętno spoczynkowe: ${pulseMin}–${pulseMax} bpm`
          : null,
      ]
        .filter(Boolean)
        .join("\n");

      // Priorytetyzacja najnowszego pomiaru
      const latestMeasurement = user.measurements[0];
      let latestMeasurementInfo = "";
      if (latestMeasurement) {
        const date = new Date(latestMeasurement.createdAt).toLocaleString(
          "pl-PL",
          {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }
        );
        latestMeasurementInfo =
          latestMeasurement.type === "ciśnienie"
            ? `${date} – Ciśnienie: ${latestMeasurement.systolic}/${latestMeasurement.diastolic} ${latestMeasurement.unit}`
            : `${date} – ${latestMeasurement.type}: ${latestMeasurement.amount} ${latestMeasurement.unit}`;
        if (latestMeasurement.context) {
          latestMeasurementInfo += `\n   • Kontekst: ${latestMeasurement.context}`;
        }
      }

      const measurementInfo = user.measurements
        .slice(1)
        .map((m) => {
          const date = new Date(m.createdAt).toLocaleString("pl-PL", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
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

      contextData = `📌 Dane użytkownika:\n${healthInfo}\n\n📈 Najnowszy pomiar:\n${latestMeasurementInfo}\n\n📊 Pozostałe pomiary:\n${measurementInfo}\n\n🧠 Historia samopoczucia:\n${checkinInfo}`;
    }

    console.log(contextData);

    // Instrukcje systemowe dostosowane do scenariuszy
    const systemInstructions = [
      "Jesteś cyfrowym asystentem zdrowia Agent Zdrowie.",
      "Udzielasz wyłącznie informacji edukacyjnych, a nie diagnoz. Nie zastępujesz lekarza.",
      "Analizuj dane w kontekście norm zdrowotnych użytkownika, podanych w danych kontekstowych.",
      "Zawsze priorytetyzuj najnowszy pomiar (na podstawie daty i godziny).",
      "Jeśli użytkownik jest w ciąży (Ciąża: Tak), zwracaj szczególną uwagę na pomiary (np. ciśnienie >130/85 mmHg, glukoza >140 mg/dL po posiłku) i zawsze zalecaj konsultację z lekarzem przy jakichkolwiek odchyleniach od normy lub objawach (np. ból, duszność).",
      "Jeśli użytkownik opisuje objawy alarmowe (np. silny ból w klatce piersiowej, duszność, objawy udaru, omdlenie, glukoza >300 mg/dL z objawami), zalecaj natychmiastowy kontakt z numerem alarmowym 112 lub SOR.",
      "Dla niestandardowych chorób (np. astma) zalecaj konsultację lekarską, jeśli pomiar lub objawy mogą być związane.",
      "Uwzględniaj poziom aktywności fizycznej i choroby przewlekłe w rekomendacjach.",
      "Szanuj prywatność – nie powtarzaj pełnych danych osobowych ani nie ujawniaj zbędnych szczegółów identyfikujących.",
      "Bądź zwięzły, konkretny i odpowiadaj po polsku.",
    ];

    const system = [...systemInstructions, "", contextData].join("\n");

    const result = await streamText({
      model: openai("gpt-4o"),
      temperature: 0.3,
      system: system,
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
