import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { PDFDocument, rgb } from "pdf-lib";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import fs from "fs/promises";
import path from "path";
import fontkit from "@pdf-lib/fontkit";
import { buildPersonalizedContext } from "@/lib/ai-context";

export const runtime = "nodejs";

// === POMOCNICZE FUNKCJE ===

// 1. Łamanie tekstu (bez zmian)
const breakTextIntoLines = (text, font, size, maxWidth) => {
  if (!text) return [];
  const words = text.split(" ");
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = font.widthOfTextAtSize(currentLine + " " + word, size);
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
};

// 2. Obliczanie wieku (bez zmian logicznych)
const calculateAge = (birthDate) => {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// 3. Helper do budowania tekstu norm z obiektu HealthNorms
const getNormsText = (normsObj) => {
  const list = [];
  if (!normsObj) {
    list.push("• Brak zdefiniowanych indywidualnych norm w profilu.");
    list.push("  (Analiza oparta o standardowe wytyczne medyczne)");
    return list;
  }

  // Ciśnienie
  if (normsObj.systolicMax || normsObj.diastolicMax) {
    const sys = normsObj.systolicMax
      ? `${normsObj.systolicMin || 90}-${normsObj.systolicMax}`
      : "< ?";
    const dia = normsObj.diastolicMax
      ? `${normsObj.diastolicMin || 60}-${normsObj.diastolicMax}`
      : "< ?";
    list.push(`• Ciśnienie docelowe: ${sys} / ${dia} mmHg`);
  }

  // Tętno
  if (normsObj.pulseMin || normsObj.pulseMax) {
    list.push(
      `• Tętno: ${normsObj.pulseMin || 60} – ${
        normsObj.pulseMax || 100
      } ud./min`
    );
  }

  // Glukoza
  if (normsObj.glucoseFastingMax) {
    list.push(
      `• Glukoza (na czczo): ${normsObj.glucoseFastingMin || 70} – ${
        normsObj.glucoseFastingMax
      } mg/dL`
    );
  }
  if (normsObj.glucosePostMealMax) {
    list.push(`• Glukoza (po posiłku): < ${normsObj.glucosePostMealMax} mg/dL`);
  }

  // Waga
  if (normsObj.weightMin || normsObj.weightMax) {
    list.push(
      `• Waga docelowa: ${normsObj.weightMin || "?"} – ${
        normsObj.weightMax || "?"
      } kg`
    );
  }

  return list;
};

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.email)
      return new Response("Unauthorized", { status: 401 });

    // 1. POBRANIE DANYCH
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        measurements: {
          take: 30,
          orderBy: { createdAt: "desc" },
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

    // Przygotowanie zmiennych skrótowych dla czytelności
    const profile = user.healthProfile || {};
    const norms = profile.norms || null;
    const conditionsList = profile.conditions
      ? profile.conditions.map((c) => c.name).join(", ")
      : "Brak";

    // Budowanie kontekstu dla AI
    // (Zakładam, że buildPersonalizedContext jest dostosowany lub przekazujemy mu obiekt w starym stylu)
    // Tutaj tworzę 'mock' obiektu usera w starym stylu, żeby nie psuć funkcji w lib/ai-context,
    // jeśli nie została zaktualizowana.
    const contextUserMock = {
      ...user,
      birthdate: profile.birthdate,
      gender: profile.gender,
      height: profile.height,
      weight: profile.weight,
      conditions: conditionsList,
      ...norms, // Rozpakowujemy normy (systolicMax itp.)
    };

    const context = buildPersonalizedContext(contextUserMock);

    // === 2. GENEROWANIE ANALIZY AI ===
    const { text: summary } = await generateText({
      model: openai("gpt-4o"),
      temperature: 0.2,
      prompt: `Jesteś asystentem medycznym AI. Generujesz raport PDF.
      
      DANE PACJENTA:
      ${context}

      ZADANIE:
      1. Przeanalizuj ostatnie 30 pomiarów pod kątem trendów i przekroczeń norm (normy: ${JSON.stringify(
        norms
      )}).
      2. Bądź konkretny. Używaj liczb.
      3. Nie używaj Markdown (pogrubień, nagłówków #), tylko czysty tekst podzielony na akapity.
      `,
    });

    // === 3. RYSOWANIE PDF ===
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    const fontPath = path.join(
      process.cwd(),
      "public/fonts/Roboto-Regular.ttf"
    );
    const fontBytes = await fs.readFile(fontPath);
    const font = await pdfDoc.embedFont(fontBytes);

    let page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();
    const margin = 50;
    const contentWidth = width - margin * 2;
    let yPosition = height - 120;

    // Helper do rysowania linii i nowej strony
    const drawLine = (text, fontSize = 11, color = rgb(0, 0, 0)) => {
      const lines = breakTextIntoLines(text, font, fontSize, contentWidth);
      const lineHeight = fontSize * 1.5;

      lines.forEach((line) => {
        if (yPosition < 50) {
          page = pdfDoc.addPage([595.28, 841.89]);
          yPosition = height - 50;
        }
        page.drawText(line, {
          x: margin,
          y: yPosition,
          size: fontSize,
          font,
          color,
        });
        yPosition -= lineHeight;
      });
      yPosition -= 3;
    };

    // -- NAGŁÓWEK --
    page.drawRectangle({
      x: 0,
      y: height - 100,
      width,
      height: 100,
      color: rgb(0.07, 0.45, 0.85),
    });

    page.drawText("Raport Zdrowotny Pacjenta", {
      x: margin,
      y: height - 50,
      size: 22,
      font,
      color: rgb(1, 1, 1),
    });

    const todayStr = new Date().toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    page.drawText(`Data generowania: ${todayStr}`, {
      x: margin,
      y: height - 80,
      size: 10,
      font,
      color: rgb(0.9, 0.9, 0.9),
    });

    // -- DANE OSOBOWE --
    drawLine("Dane identyfikacyjne:", 14, rgb(0.07, 0.45, 0.85));
    yPosition -= 5;

    const age = calculateAge(profile.birthdate);
    let headerInfo = `• Pacjent: ${user.name || user.email}`;
    if (age) headerInfo += `   • Wiek: ${age} lat`;
    if (profile.gender) {
      // Mapowanie Enuma na PL
      const genderPL =
        profile.gender === "MALE"
          ? "Mężczyzna"
          : profile.gender === "FEMALE"
          ? "Kobieta"
          : profile.gender;
      headerInfo += `   • Płeć: ${genderPL}`;
    }

    drawLine(headerInfo, 11);

    let bioInfo = "";
    if (profile.height) bioInfo += `• Wzrost: ${profile.height} cm   `;
    if (profile.weight) bioInfo += `• Waga obecna: ${profile.weight} kg   `;
    // BMI mamy w tabeli norms, jeśli istnieje
    if (norms && norms.bmi) bioInfo += `• BMI (cel/norma): ${norms.bmi}`;

    if (bioInfo) drawLine(bioInfo, 11);
    if (conditionsList !== "Brak")
      drawLine(`• Choroby przewlekłe: ${conditionsList}`, 11);
    if (profile.medications) drawLine(`• Leki: ${profile.medications}`, 11);

    yPosition -= 15;

    // -- NORMY --
    drawLine("Indywidualne cele terapeutyczne:", 12, rgb(0.07, 0.45, 0.85));
    yPosition -= 2;

    const normsTextLines = getNormsText(norms);
    normsTextLines.forEach((t) => drawLine(t, 10, rgb(0.3, 0.3, 0.3)));

    yPosition -= 15;

    // -- ANALIZA AI --
    drawLine("Analiza trendów (AI):", 14, rgb(0.07, 0.45, 0.85));
    yPosition -= 5;

    if (summary) {
      const paragraphs = summary.split("\n").filter((l) => l.trim().length > 0);
      paragraphs.forEach((p) => {
        const clean = p.replace(/\*\*/g, "").replace(/\*/g, "-");
        drawLine(clean, 11);
      });
    } else {
      drawLine("Brak danych do analizy.", 11);
    }

    yPosition -= 20;

    // -- LISTA POMIARÓW --
    drawLine("Ostatnie pomiary:", 14, rgb(0.07, 0.45, 0.85));
    yPosition -= 5;

    if (user.measurements.length > 0) {
      user.measurements.forEach((m) => {
        const mDate = new Date(m.createdAt).toLocaleDateString("pl-PL", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });

        // Mapowanie typów i wartości (Nowa Schema)
        let lineText = "";
        let isAlarming = false;

        switch (m.type) {
          case "BLOOD_PRESSURE":
            const sys = m.value;
            const dia = m.value2;
            lineText = `• ${mDate} | Ciśnienie: ${sys}/${dia} mmHg`;
            if (norms && norms.systolicMax && sys > norms.systolicMax)
              isAlarming = true;
            if (norms && norms.diastolicMax && dia > norms.diastolicMax)
              isAlarming = true;
            break;

          case "GLUCOSE":
            lineText = `• ${mDate} | Glukoza: ${m.value} mg/dL`;
            // Jeśli mamy kontekst (np. "Na czczo"), sprawdzamy odpowiednią normę
            // Tutaj uproszczenie: sprawdzamy max na czczo jako bezpiecznik
            if (
              norms &&
              norms.glucoseFastingMax &&
              m.value > norms.glucoseFastingMax
            ) {
              // Można dodać sprawdzanie m.context jeśli istnieje
              isAlarming = true;
            }
            break;

          case "WEIGHT":
            lineText = `• ${mDate} | Waga: ${m.value} kg`;
            break;

          case "HEART_RATE":
            lineText = `• ${mDate} | Tętno: ${m.value} ud./min`;
            if (norms && norms.pulseMax && m.value > norms.pulseMax)
              isAlarming = true;
            break;

          default:
            lineText = `• ${mDate} | ${m.type}: ${m.value}`;
        }

        if (m.context) lineText += ` (${m.context})`;
        if (m.note) lineText += ` - ${m.note}`;

        if (isAlarming) {
          lineText += " (!)";
          drawLine(lineText, 10, rgb(0.8, 0, 0));
        } else {
          drawLine(lineText, 10);
        }
      });
    } else {
      drawLine("Brak zapisanych pomiarów.", 11);
    }

    // Stopka
    page.drawText(
      "Dokument wygenerowany automatycznie przez system Agent Zdrowie.",
      {
        x: margin,
        y: 30,
        size: 8,
        font,
        color: rgb(0.6, 0.6, 0.6),
      }
    );

    const pdfBytes = await pdfDoc.save();
    const safeDate = new Date().toISOString().slice(0, 10);
    const fileName = `Raport_Medyczny_${safeDate}.pdf`;

    return new Response(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("PDF Generation Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
