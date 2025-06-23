import { NextRequest } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.email) {
    return new Response("Unauthorized", { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { measurements: { orderBy: { createdAt: "desc" }, take: 20 } },
  });

  if (!user) {
    return new Response("User not found", { status: 404 });
  }

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
    age && `Wiek: ${age} lat`,
    gender && `Płeć: ${gender === "M" ? "mężczyzna" : "kobieta"}`,
    height && `Wzrost: ${height} cm`,
    weight && `Waga: ${weight} kg`,
    medications && `Leki: ${medications}`,
    bmi && `BMI: ${bmi}`,
    systolicMin &&
      systolicMax &&
      `Ciśnienie skurczowe: ${systolicMin}–${systolicMax}`,
    diastolicMin &&
      diastolicMax &&
      `Rozkurczowe: ${diastolicMin}–${diastolicMax}`,
    glucoseFastingMin &&
      glucoseFastingMax &&
      `Glukoza (na czczo): ${glucoseFastingMin}–${glucoseFastingMax}`,
    glucosePostMealMax && `Glukoza (po posiłku): max ${glucosePostMealMax}`,
    weightMin && weightMax && `Zakres wagi: ${weightMin}–${weightMax}`,
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
      return m.type === "ciśnienie"
        ? `${date} – Ciśnienie: ${m.systolic}/${m.diastolic} ${m.unit}`
        : `${date} – ${m.type}: ${m.amount} ${m.unit}`;
    })
    .join("\n");

  const context = `📌 Dane użytkownika:\n${healthInfo}\n\n📈 Ostatnie pomiary:\n${measurementInfo}`;

  const result = await streamText({
    model: openai("gpt-4o"),
    system: `Jestem Agent Zdrowie – cyfrowym asystentem zdrowia. Generuj przyjazny, empatyczny raport.`,
    prompt: context,
  });

  return result.toDataStreamResponse();
}
