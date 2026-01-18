import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { PDFDocument, rgb } from "pdf-lib";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import fs from "fs/promises";
import path from "path";
import fontkit from "@pdf-lib/fontkit";

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
    .replace(/\s{2,}/g, " ")
    .replace(/([.,!?;:])([^\s])/g, "$1 $2")
    .trim();
}

function calculateAge(birthDate) {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function padZero(num) {
  return num.toString().padStart(2, "0");
}

function getNormsText(normsObj) {
  const list = [];
  if (!normsObj) {
    list.push("• Brak zdefiniowanych indywidualnych norm w profilu.");
    list.push("  (Analiza oparta o standardowe wytyczne medyczne)");
    return list;
  }

  if (normsObj.systolicMax || normsObj.diastolicMax) {
    const sys = normsObj.systolicMax
      ? `${normsObj.systolicMin || 90}-${normsObj.systolicMax}`
      : "< ?";
    const dia = normsObj.diastolicMax
      ? `${normsObj.diastolicMin || 60}-${normsObj.diastolicMax}`
      : "< ?";
    list.push(`• Ciśnienie docelowe: ${sys} / ${dia} mmHg`);
  }

  if (normsObj.pulseMin || normsObj.pulseMax) {
    list.push(
      `• Tętno spoczynkowe: ${normsObj.pulseMin || 60}–${normsObj.pulseMax || 100} ud./min`,
    );
  }

  if (normsObj.glucoseFastingMax) {
    list.push(
      `• Glukoza na czczo: ${normsObj.glucoseFastingMin || 70}–${normsObj.glucoseFastingMax} mg/dL`,
    );
  }
  if (normsObj.glucosePostMealMax) {
    list.push(`• Glukoza po posiłku: < ${normsObj.glucosePostMealMax} mg/dL`);
  }

  if (normsObj.weightMin || normsObj.weightMax) {
    list.push(
      `• Waga docelowa: ${normsObj.weightMin || "?"}–${normsObj.weightMax || "?"} kg`,
    );
  }
  if (normsObj.bmi) {
    list.push(`• Aktualne BMI: ${normsObj.bmi}`);
  }

  return list;
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { dateFrom, dateTo } = await request.json();

    // 1. Walidacja serwerowa dat
    if (!dateFrom || !dateTo) {
      return new Response("Wymagane daty od/do", { status: 400 });
    }

    const d1 = new Date(dateFrom);
    const d2 = new Date(dateTo);
    const diffTime = Math.abs(d2 - d1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 366) {
      return new Response("Zakres raportu nie może przekraczać 1 roku.", {
        status: 400,
      });
    }

    const SAFETY_LIMIT = 1460; // 365 * 4

    const dateFilter = {
      createdAt: {
        gte: new Date(dateFrom),
        lte: new Date(`${dateTo}T23:59:59.999Z`),
      },
    };

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        measurements: {
          where: dateFilter,
          orderBy: { createdAt: "desc" },
          take: SAFETY_LIMIT,
        },
        healthProfile: {
          include: {
            norms: true,
            conditions: true,
          },
        },
      },
    });

    if (!user) return new Response("User not found", { status: 404 });

    const measurements = user.measurements;
    const profile = user.healthProfile || {};
    const norms = profile.norms || {};
    const conditionsList = profile.conditions
      ? profile.conditions.map((c) => c.name).join(", ")
      : "Brak";

    const chronologicalData = [...measurements].reverse();

    const dataForAI = chronologicalData
      .map((m) => {
        const d = m.createdAt.toISOString().slice(0, 10);
        // Skracanie typów
        let type = "Inne";
        if (m.type === "BLOOD_PRESSURE") type = "BP";
        else if (m.type === "HEART_RATE") type = "HR";
        else if (m.type === "GLUCOSE") type = "GLU";
        else if (m.type === "WEIGHT") type = "WAGA";

        let val = `${m.value}`;
        if (m.value2) val += `/${m.value2}`;

        return `${d}|${type}|${val}${m.context ? `|${m.context}` : ""}`;
      })
      .join("\n");

    const limitNote =
      measurements.length === SAFETY_LIMIT
        ? "(dane ograniczone do 1000 wpisów)"
        : "";

    const { text: aiComment } = await generateText({
      model: openai("gpt-4o"),
      temperature: 0.3,
      maxTokens: 450,
      prompt: `
Jesteś analitykiem medycznym.
Dane pacjenta: Wiek ${calculateAge(profile.birthdate) || "?"}, Płeć ${profile.gender || "?"}, Schorzenia: ${conditionsList}.
Indywidualne cele: ${norms.weightMax ? `Waga < ${norms.weightMax}` : ""} ${norms.systolicMax ? `BP < ${norms.systolicMax}/${norms.diastolicMax}` : ""}.

Historia pomiarów (${dateFrom} do ${dateTo}) ${limitNote}:
FORMAT: Data | Typ | Wynik | Kontekst
---
${dataForAI}
---

Zadanie:
1. Przeanalizuj trendy w tym okresie (czy parametry się poprawiają/pogarszają/są stabilne?).
2. Zwróć uwagę na anomalie lub częste przekroczenia norm.
3. Napisz zwięzłe podsumowanie dla pacjenta.
4. Język profesjonalny, ale zrozumiały. NIE stawiaj diagnoz. Max 150 słów.
      `.trim(),
    });

    // Generowanie PDF

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
    } catch (e) {
      console.error("Brak czcionki Roboto", e);
      return new Response("Missing font file - check public/fonts folder", {
        status: 500,
      });
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

    // Nagłówek Raportu
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

    const period = `Okres raportu: ${dateFrom} – ${dateTo}`;
    drawLine(period, 11, rgb(0.4, 0.4, 0.4));
    if (measurements.length === SAFETY_LIMIT) {
      drawLine(
        `(Uwaga: Osiągnięto limit ${SAFETY_LIMIT} najnowszych pomiarów)`,
        10,
        rgb(0.8, 0.2, 0.2),
      );
    }
    y -= 18;

    //  Pacjent
    drawLine("Dane pacjenta", 14, rgb(0.02, 0.62, 0.42));
    y -= 8;
    let patientLine = `Pacjent: ${user.name || user.email}`;
    const age = calculateAge(profile.birthdate);
    if (age) patientLine += ` • ${age} lat`;
    if (profile.gender)
      patientLine += ` • ${profile.gender === "MALE" ? "M" : "K"}`;
    drawLine(patientLine, 11);

    let bioLine = "";
    if (profile.height) bioLine += `Wzrost ${profile.height} cm`;
    if (profile.weight)
      bioLine += (bioLine ? " • " : "") + `Waga ${profile.weight} kg`;
    if (norms.bmi) bioLine += (bioLine ? " • " : "") + `BMI ${norms.bmi}`;
    if (bioLine) drawLine(bioLine, 11);
    y -= 18;

    // Normy
    drawLine("Indywidualne normy", 14, rgb(0.02, 0.62, 0.42));
    y -= 8;
    getNormsText(norms).forEach((l) =>
      drawLine(l, 10.5, rgb(0.28, 0.28, 0.28)),
    );
    y -= 18;

    // Analiza AI
    drawLine("Analiza trendów (AI)", 14, rgb(0.02, 0.62, 0.42));
    y -= 8;
    if (aiComment && aiComment.trim().length > 20) {
      aiComment.split(/\n\s*\n/).forEach((p) => {
        if (p.trim()) drawLine(p.trim(), 11, rgb(0.12, 0.12, 0.12));
        y -= 3;
      });
    } else {
      drawLine(
        "Brak wystarczających danych do analizy.",
        11,
        rgb(0.6, 0.6, 0.6),
      );
    }
    y -= 18;

    // Tabela Pomiarów
    drawLine("Szczegółowy rejestr pomiarów", 14, rgb(0.02, 0.62, 0.42));
    y -= 12;

    if (measurements.length === 0) {
      drawLine(
        "Brak zarejestrowanych pomiarów w tym okresie.",
        11,
        rgb(0.6, 0.6, 0.6),
      );
    } else {
      const dateColumnWidth = 85;

      for (const m of measurements) {
        if (y < 60) {
          page = pdfDoc.addPage([595.28, 841.89]);
          y = height - 60;
        }

        const d = new Date(m.createdAt);
        const day = padZero(d.getDate());
        const month = padZero(d.getMonth() + 1);
        const year = d.getFullYear();
        const hour = padZero(d.getHours());
        const minute = padZero(d.getMinutes());
        const dateStr = `${day}.${month}.${year}, ${hour}:${minute}`;

        let valueText = "";
        let isAlarm = false;

        switch (m.type) {
          case "BLOOD_PRESSURE":
            const s = Number(m.value);
            const dVal = Number(m.value2 || 0);
            valueText = `Ciśnienie: ${s}/${dVal} mmHg`;
            if (
              (norms.systolicMax && s > norms.systolicMax) ||
              (norms.diastolicMax && dVal > norms.diastolicMax) ||
              (norms.systolicMin && s < norms.systolicMin) ||
              (norms.diastolicMin && dVal < norms.diastolicMin)
            )
              isAlarm = true;
            break;

          case "GLUCOSE":
            const g = Number(m.value);
            valueText = `Glukoza: ${g} mg/dL`;
            if (m.context?.toLowerCase().includes("po posiłku")) {
              if (norms.glucosePostMealMax && g > norms.glucosePostMealMax)
                isAlarm = true;
            } else if (
              (norms.glucoseFastingMax && g > norms.glucoseFastingMax) ||
              (norms.glucoseFastingMin && g < norms.glucoseFastingMin)
            ) {
              isAlarm = true;
            }
            if (m.context) valueText += ` (${m.context})`;
            break;

          case "HEART_RATE":
            const p = Number(m.value);
            valueText = `Tętno: ${p} bpm`;
            if (
              (norms.pulseMax && p > norms.pulseMax) ||
              (norms.pulseMin && p < norms.pulseMin)
            )
              isAlarm = true;
            break;

          case "WEIGHT":
            const w = Number(m.value);
            valueText = `Waga: ${w} kg`;
            if (
              (norms.weightMax && w > norms.weightMax) ||
              (norms.weightMin && w < norms.weightMin)
            )
              isAlarm = true;
            break;

          default:
            valueText = `${m.type}: ${m.value}`;
        }

        if (m.note) valueText += `  – ${m.note.trim()}`;
        if (isAlarm) valueText += "  !";

        page.drawText(dateStr, {
          x: margin,
          y: y,
          size: 10,
          font,
          color: rgb(0.45, 0.45, 0.45),
        });

        const contentX = margin + dateColumnWidth;
        const textColor = isAlarm ? rgb(0.85, 0.1, 0.1) : rgb(0, 0, 0);

        const availableWidth = width - contentX - margin;
        const lines = breakTextIntoLines(valueText, font, 11, availableWidth);
        const lineHeight = 11 * 1.42;

        for (let i = 0; i < lines.length; i++) {
          page.drawText(lines[i], {
            x: contentX,
            y: y - i * lineHeight,
            size: 11,
            font,
            color: textColor,
          });
        }

        const rowsUsed = lines.length > 0 ? lines.length : 1;
        y -= rowsUsed * lineHeight + 6;
      }
    }

    const lastPage = pdfDoc.getPages()[pdfDoc.getPageCount() - 1];
    lastPage.drawText("Raport wygenerowany automatycznie", {
      x: margin,
      y: 38,
      size: 8,
      font,
      color: rgb(0.6, 0.6, 0.6),
    });

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
