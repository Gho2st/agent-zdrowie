import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { PDFDocument, rgb } from "pdf-lib";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import fs from "fs/promises";
import path from "path";
import fontkit from "@pdf-lib/fontkit";
import { MeasurementType } from "@prisma/client";
import { analyzeMeasurement } from "@/app/utils/healthAnalysis";
import { calculateStats, buildPersonalizedContext } from "@/lib/ai-context";

export const runtime = "nodejs";

function breakTextIntoLines(text, font, size, maxWidth) {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    if (word.length > 22) {
      let remaining = word;
      while (remaining.length > 0) {
        const chunk = remaining.slice(0, 20);
        const test = currentLine ? currentLine + " " + chunk : chunk;
        if (font.widthOfTextAtSize(test, size) <= maxWidth) {
          currentLine = test;
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = chunk;
        }
        remaining = remaining.slice(20);
      }
      continue;
    }
    const testLine = currentLine ? currentLine + " " + word : word;
    if (font.widthOfTextAtSize(testLine, size) <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function cleanAiText(text) {
  return (text || "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\*{2,}/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function calculateAgeSimple(birthdate) {
  if (!birthdate) return null;
  const today = new Date();
  const birth = new Date(birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function formatNormsForPDF(norms) {
  const list = [];
  if (!norms) return ["Brak zdefiniowanych celów (normy standardowe)."];
  if (norms.optimalSystolicMax || norms.optimalDiastolicMax) {
    const sys = norms.optimalSystolicMax
      ? `${norms.systolicMin || 90}-${norms.optimalSystolicMax}`
      : "<?>";
    const dia = norms.optimalDiastolicMax
      ? `${norms.diastolicMin || 60}-${norms.optimalDiastolicMax}`
      : "<?>";
    list.push(`• Ciśnienie docelowe: ${sys} / ${dia} mmHg`);
  }
  if (norms.pulseMax)
    list.push(`• Tętno: ${norms.pulseMin || 60}–${norms.pulseMax} bpm`);
  if (norms.glucoseFastingMax)
    list.push(
      `• Glukoza (na czczo): ${norms.glucoseFastingMin || 70}–${norms.glucoseFastingMax} mg/dL`,
    );
  if (norms.glucosePostMealMax)
    list.push(`• Glukoza (po posiłku): < ${norms.glucosePostMealMax} mg/dL`);
  if (norms.weightMax)
    list.push(
      `• Waga docelowa: ${norms.weightMin || "?"}–${norms.weightMax} kg`,
    );
  return list.length > 0
    ? list
    : ["Pacjent korzysta ze standardowych norm medycznych."];
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { dateFrom, dateTo } = await request.json();

    // Walidacja dat
    if (!dateFrom || !dateTo) return new Response("Brak dat", { status: 400 });
    const d1 = new Date(dateFrom);
    const d2 = new Date(dateTo);
    if (d2 < d1)
      return new Response("Data 'do' mniejsza niż 'od'", { status: 400 });

    const maxDate = new Date(d1);
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    if (d2 > maxDate)
      return new Response("Zakres raportu max 1 rok.", { status: 400 });

    // 1. Pobieranie danych
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        measurements: {
          where: {
            createdAt: {
              gte: new Date(dateFrom),
              lte: new Date(`${dateTo}T23:59:59.999Z`),
            },
          },
          orderBy: { createdAt: "desc" },
        },
        healthProfile: {
          include: { norms: true, conditions: true },
        },
        dailyCheckins: {
          where: {
            date: {
              gte: new Date(dateFrom),
              lte: new Date(`${dateTo}T23:59:59.999Z`),
            },
          },
          orderBy: { date: "desc" },
        },
      },
    });

    if (!user) return new Response("User not found", { status: 404 });

    const measurements = user.measurements;
    const allCheckins = user.dailyCheckins;
    const profile = user.healthProfile || {};
    const norms = profile.norms || {};

    // 2. Statystyki
    const statsLines = calculateStats(measurements, norms, allCheckins);
    const statsText = statsLines.join("\n") || "Brak danych do statystyk.";

    // 3. Przygotowanie danych do AI
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const cutoffDate = new Date(d2);
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    const aiMeasurements = measurements.filter(
      (m) => new Date(m.createdAt) >= cutoffDate,
    );
    const aiCheckins = allCheckins.filter(
      (c) => new Date(c.date) >= cutoffDate,
    );

    const contextForAI = buildPersonalizedContext(
      profile,
      norms,
      statsText,
      aiMeasurements,
      aiCheckins,
    );

    // Dynamiczne pytanie nr 2
    let question2 = "Czy w analizowanym okresie parametry są stabilne?";
    if (diffDays < 30) {
      question2 =
        "2. Czy w tym wycinku czasu widać nagłe anomalie lub niebezpieczne odchylenia?";
    } else {
      question2 =
        "2. Czy analizowany okres wskazuje na stabilizację parametrów, czy widać tendencję pogarszania?";
    }

    // 4. Generowanie AI
    const { text: aiComment } = await generateText({
      model: openai("gpt-4o"),
      temperature: 0.3,
      maxTokens: 750,
      system:
        "Jesteś asystentem medycznym. Analizujesz trendy i obecną sytuację pacjenta.",
      prompt: `
Na podstawie danych przygotuj podsumowanie dla lekarza.
1. Czy cele terapeutyczne są spełniane (patrz sekcja statystyk z całego okresu)?
${question2}
3. Wnioski ogólne.

DANE:
${contextForAI}
      `.trim(),
    });

    // 5. Generowanie PDF
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    const fontPath = path.join(
      process.cwd(),
      "public/fonts/Roboto-Regular.ttf",
    );
    let font;
    try {
      const fontBytes = await fs.readFile(fontPath);
      font = await pdfDoc.embedFont(fontBytes);
    } catch {
      return new Response("Missing font file", { status: 500 });
    }

    let page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();
    const margin = 52;
    let y = height - 110;

    const drawLine = (
      text,
      size = 11,
      color = rgb(0, 0, 0),
      customX = margin,
    ) => {
      const cleaned = cleanAiText(text);
      const availableWidth = width - margin - customX;
      const lines = breakTextIntoLines(cleaned, font, size, availableWidth);
      const lineHeight = size * 1.42;
      lines.forEach((line) => {
        if (y < 60) {
          page = pdfDoc.addPage([595.28, 841.89]);
          y = height - 60;
        }
        page.drawText(line, { x: customX, y, size, font, color });
        y -= lineHeight;
      });
      y -= 3;
    };

    // Header PDF
    page.drawRectangle({
      x: 0,
      y: height - 100,
      width,
      height: 100,
      color: rgb(0.02, 0.62, 0.42),
    });
    page.drawText("RAPORT ZDROWOTNY", {
      x: margin,
      y: height - 55,
      size: 23,
      font,
      color: rgb(1, 1, 1),
    });
    page.drawText(`Wygenerowano: ${new Date().toLocaleDateString("pl-PL")}`, {
      x: margin,
      y: height - 82,
      size: 10,
      font,
      color: rgb(0.97, 0.97, 0.97),
    });

    y = height - 125;
    drawLine(`Okres raportu: ${dateFrom} – ${dateTo}`, 11, rgb(0.4, 0.4, 0.4));
    y -= 15;

    // Dane pacjenta
    drawLine("Dane pacjenta", 14, rgb(0.02, 0.62, 0.42));
    y -= 8;
    const ageVal = calculateAgeSimple(profile.birthdate);
    let patientInfo = `Pacjent: ${user.name || user.email}`;
    if (ageVal) patientInfo += ` • ${ageVal} lat`;
    if (profile.gender)
      patientInfo += ` • ${profile.gender === "MALE" ? "M" : "K"}`;
    drawLine(patientInfo, 11);
    if (profile.conditions && profile.conditions.length > 0) {
      const conds = profile.conditions.map((c) => c.name).join(", ");
      drawLine(`Rozpoznania: ${conds}`, 10, rgb(0.3, 0.3, 0.3));
    }
    y -= 15;

    // Normy
    drawLine("Indywidualne cele i normy", 14, rgb(0.02, 0.62, 0.42));
    y -= 8;
    const normsList = formatNormsForPDF(norms);
    normsList.forEach((line) => drawLine(line, 10, rgb(0.2, 0.2, 0.2)));
    y -= 15;

    // Statystyki
    drawLine("Statystyki (Cały okres raportu)", 14, rgb(0.02, 0.62, 0.42));
    y -= 8;
    if (statsLines.length > 0) {
      statsLines.forEach((l) => drawLine(l, 10.5, rgb(0.2, 0.2, 0.2)));
    } else {
      drawLine("Brak danych.", 11, rgb(0.5, 0.5, 0.5));
    }
    y -= 15;

    // Opinia AI
    drawLine("Analiza asystenta (AI)", 14, rgb(0.02, 0.62, 0.42));
    y -= 8;
    if (aiComment) {
      aiComment.split(/\n\s*\n/).forEach((p) => {
        if (p.trim()) {
          drawLine(p.trim(), 11, rgb(0.1, 0.1, 0.1));
          y -= 4;
        }
      });
    }
    y -= 15;

    // Historia pomiarów
    drawLine(
      `Rejestr pomiarów (${measurements.length} wpisów)`,
      14,
      rgb(0.02, 0.62, 0.42),
    );
    y -= 12;

    if (measurements.length === 0) {
      drawLine("Brak pomiarów w wybranym okresie.", 11, rgb(0.6, 0.6, 0.6));
    } else {
      const dateColumnWidth = 105;
      const valueColumnStart = margin + dateColumnWidth;

      const textPadding = 15;
      const textColumnStart = valueColumnStart + textPadding;

      for (const m of measurements) {
        if (y < 80) {
          page = pdfDoc.addPage([595.28, 841.89]);
          y = height - 60;
        }

        const d = new Date(m.createdAt);
        const dateStr = `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getFullYear()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;

        let valueForAnalysis =
          m.type === MeasurementType.BLOOD_PRESSURE
            ? { sys: Number(m.value), dia: Number(m.value2 || 0) }
            : Number(m.value);

        const analysis = analyzeMeasurement(
          m.type,
          valueForAnalysis,
          norms,
          { context: m.context || "spoczynkowe", timing: m.context || "" },
          profile.highRisk || false,
        );

        // Wybór typu i wartości tekstowej
        let typeLabel = "";
        switch (m.type) {
          case MeasurementType.BLOOD_PRESSURE:
            typeLabel = "Ciśnienie";
            break;
          case MeasurementType.GLUCOSE:
            typeLabel = "Glukoza";
            break;
          case MeasurementType.WEIGHT:
            typeLabel = "Waga";
            break;
          case MeasurementType.HEART_RATE:
            typeLabel = "Tętno";
            break;
          default:
            typeLabel =
              m.type.charAt(0).toUpperCase() + m.type.slice(1).toLowerCase();
        }

        let valueText = "";
        if (m.type === MeasurementType.BLOOD_PRESSURE) {
          valueText = `${valueForAnalysis.sys}/${valueForAnalysis.dia} mmHg`;
        } else if (m.type === MeasurementType.GLUCOSE) {
          valueText = `${valueForAnalysis} mg/dL`;
        } else if (m.type === MeasurementType.WEIGHT) {
          valueText = `${valueForAnalysis} kg`;
        } else if (m.type === MeasurementType.HEART_RATE) {
          valueText = `${valueForAnalysis} bpm`;
        } else {
          valueText = m.value;
        }

        const fullDisplayText = `${typeLabel}: ${valueText}`;

        // 1. Dobór koloru  (statusu)
        let statusColor;
        switch (analysis.color) {
          case "red":
            statusColor = rgb(0.88, 0.12, 0.12); // Czerwony - krytyczne
            break;
          case "orange":
          case "yellow":
            statusColor = rgb(0.92, 0.52, 0.08); // Pomarańczowy - ostrzeżenie
            break;
          case "blue":
            statusColor = rgb(0.0, 0.4, 0.8); // Niebieski - za niskie
            break;
          case "green":
          default:
            statusColor = rgb(0.05, 0.6, 0.12); // Zielony - norma
            break;
        }

        // 2. Rysowanie

        // Data (szary)
        page.drawText(dateStr, {
          x: margin,
          y,
          size: 10,
          font,
          color: rgb(0.42, 0.42, 0.46),
        });

        //  (status)
        page.drawCircle({
          x: valueColumnStart + 3,
          y: y + 3.5,
          size: 4, // średnica kropki
          color: statusColor,
          opacity: 1,
        });

        // Łamanie tekstu
        const valueLines = breakTextIntoLines(
          fullDisplayText,
          font,
          11,
          width - textColumnStart - margin - 10,
        );

        valueLines.forEach((line, i) => {
          page.drawText(line, {
            x: textColumnStart, // przesunięty w prawo za kropkę
            y: y - i * 13.5,
            size: 11,
            font,
            color: rgb(0.1, 0.1, 0.1),
          });
        });

        const linesUsed = valueLines.length || 1;
        y -= linesUsed * 13.5 + 12; // odstęp
      }
    }

    const pdfBytes = await pdfDoc.save();

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Raport_${dateFrom}_${dateTo}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
