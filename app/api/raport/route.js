import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { PDFDocument, rgb } from "pdf-lib";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { promises as fs } from "fs";
import path from "path";
// @ts-expect-error: brak typów dla fontkit
import * as fontkit from "fontkit";

export const runtime = "nodejs"; // ⬅️ ważne dla App Routera

export async function POST() {
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
    birthdate,
    gender,
    height: userHeight,
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
    birthdate && `Data urodzenia: ${birthdate}`,
    gender && `Płeć: ${gender === "M" ? "mężczyzna" : "kobieta"}`,
    userHeight && `Wzrost: ${userHeight} cm`,
    weight && `Waga: ${weight} kg`,
    medications && `Leki: ${medications}`,
    conditions && `Leki: ${conditions}`,
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

  const { text } = await generateText({
    model: openai("gpt-4o"),
    prompt: `
Jesteś profesjonalnym asystentem medycznym. Na podstawie danych użytkownika wygeneruj zwięzły, przejrzysty raport dla lekarza w języku polskim.

Dane użytkownika i pomiary:
${context}  
`,
  });

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const fontPath = path.join(process.cwd(), "public/fonts/Roboto-Regular.ttf");
  const fontBytes = await fs.readFile(fontPath);
  const customFont = await pdfDoc.embedFont(fontBytes);

  const page = pdfDoc.addPage();
  const { height: pageHeight, width: pageWidth } = page.getSize();

  const fontSize = 12;
  const margin = 50;
  const maxWidth = pageWidth - 2 * margin;
  let y = pageHeight - margin;

  const lines = text.split("\n");

  for (const line of lines) {
    const words = line.split(" ");
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const textWidth = customFont.widthOfTextAtSize(testLine, fontSize);

      if (textWidth < maxWidth) {
        currentLine = testLine;
      } else {
        if (y < margin + fontSize) {
          const newPage = pdfDoc.addPage();
          y = newPage.getSize().height - margin;
        }
        page.drawText(currentLine, {
          x: margin,
          y,
          size: fontSize,
          font: customFont,
          color: rgb(0, 0, 0),
        });
        y -= fontSize + 4;
        currentLine = word;
      }
    }

    if (currentLine) {
      if (y < margin + fontSize) {
        const newPage = pdfDoc.addPage();
        y = newPage.getSize().height - margin;
      }
      page.drawText(currentLine, {
        x: margin,
        y,
        size: fontSize,
        font: customFont,
        color: rgb(0, 0, 0),
      });
      y -= fontSize + 4;
    }
  }

  const pdfBytes = await pdfDoc.save();

  return new Response(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=raport-zdrowotny.pdf",
    },
  });
}
