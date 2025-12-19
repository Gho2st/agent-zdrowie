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

// 1. Łamanie tekstu (dla pdf-lib)
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

// 2. Obliczanie wieku
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
      `• Tętno spoczynkowe: ${normsObj.pulseMin || 60} – ${
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

  // Waga/BMI
  if (normsObj.weightMin || normsObj.weightMax) {
    list.push(
      `• Waga docelowa: ${normsObj.weightMin || "?"} – ${
        normsObj.weightMax || "?"
      } kg`
    );
  }
  if (normsObj.bmi) {
    list.push(`• Twoje obecne BMI: ${normsObj.bmi}`);
  }

  return list;
};

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.email)
      return new Response("Unauthorized", { status: 401 });

    // 1. POBRANIE DANYCH Z NOWEJ STRUKTURY BAZY
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        // Pobieramy pomiary
        measurements: {
          take: 30,
          orderBy: { createdAt: "desc" },
        },
        // Pobieramy profil zdrowotny z normami i chorobami
        healthProfile: {
          include: {
            norms: true,
            conditions: true,
          },
        },
      },
    });

    if (!user) return new Response("User not found", { status: 404 });

    const profile = user.healthProfile || {};
    const norms = profile.norms || {};

    // Konwersja chorób (relacja wiele-do-wielu) na string
    const conditionsList = profile.conditions
      ? profile.conditions.map((c) => c.name).join(", ")
      : "Brak";

    // Przygotowanie obiektu dla kontekstu AI (spłaszczamy strukturę)
    const contextUserMock = {
      name: user.name,
      birthdate: profile.birthdate,
      gender: profile.gender,
      height: profile.height,
      weight: profile.weight,
      conditions: conditionsList,
      medications: profile.medications,
      // Flagi chorobowe
      hasDiabetes: profile.hasDiabetes,
      hasHypertension: profile.hasHypertension,
      hasHeartDisease: profile.hasHeartDisease,
      // Normy
      ...norms,
    };

    // Generowanie tekstowego kontekstu dla promptu
    const context = buildPersonalizedContext(contextUserMock);

    // === 2. GENEROWANIE ANALIZY AI ===
    const { text: summary } = await generateText({
      model: openai("gpt-4o"),
      temperature: 0.2,
      prompt: `Jesteś asystentem medycznym AI. Generujesz profesjonalny raport PDF dla pacjenta.
      
      DANE PACJENTA I KONTEKST MEDYCZNY:
      ${context}

      OSTATNIE POMIARY (JSON):
      ${JSON.stringify(
        user.measurements.map((m) => ({
          type: m.type,
          value: m.value,
          value2: m.value2, // dla ciśnienia
          date: m.createdAt,
        }))
      )}

      ZADANIE:
      1. Przeanalizuj te pomiary w odniesieniu do indywidualnych norm pacjenta (jeśli istnieją) lub norm ogólnych.
      2. Wskaż ewentualne niepokojące trendy (np. wzrost ciśnienia w ciągu ostatnich dni).
      3. Bądź konkretny i rzeczowy.
      4. Nie używaj Markdown. Używaj czystego tekstu.
      `,
    });

    // === 3. RYSOWANIE PDF ===
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    // Ścieżka do czcionki (wymagana dla polskich znaków)
    const fontPath = path.join(
      process.cwd(),
      "public/fonts/Roboto-Regular.ttf"
    );
    let font;

    try {
      const fontBytes = await fs.readFile(fontPath);
      font = await pdfDoc.embedFont(fontBytes);
    } catch {
      console.error(
        "Błąd ładowania czcionki. Upewnij się, że plik istnieje w public/fonts/"
      );
      return new Response("Server configuration error (font missing)", {
        status: 500,
      });
    }

    let page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    const margin = 50;
    const contentWidth = width - margin * 2;
    let yPosition = height - 120;

    // Helper do rysowania linii z obsługą nowej strony
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

    // -- NAGŁÓWEK GRAFICZNY --
    page.drawRectangle({
      x: 0,
      y: height - 100,
      width,
      height: 100,
      color: rgb(0.02, 0.6, 0.4), // Szmaragdowy kolor (Emerald)
    });

    page.drawText("Raport Zdrowotny", {
      x: margin,
      y: height - 50,
      size: 24,
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
    drawLine("Podsumowanie Profilu:", 14, rgb(0.02, 0.6, 0.4));
    yPosition -= 5;

    const age = calculateAge(profile.birthdate);
    let headerInfo = `Pacjent: ${user.name || user.email}`;
    if (age) headerInfo += `  •  Wiek: ${age} lat`;
    if (profile.gender) {
      const genderPL = profile.gender === "MALE" ? "Mężczyzna" : "Kobieta";
      headerInfo += `  •  Płeć: ${genderPL}`;
    }
    drawLine(headerInfo, 11);

    let bioInfo = "";
    if (profile.height) bioInfo += `Wzrost: ${profile.height} cm   `;
    if (profile.weight) bioInfo += `Waga: ${profile.weight} kg   `;
    if (norms.bmi) bioInfo += `BMI: ${norms.bmi}`;

    if (bioInfo) drawLine(bioInfo, 11);

    if (conditionsList && conditionsList !== "Brak") {
      drawLine(`Zdiagnozowane schorzenia: ${conditionsList}`, 11);
    }
    if (profile.medications) {
      drawLine(`Przyjmowane leki: ${profile.medications}`, 11);
    }
    // Flagi chorobowe (jeśli nie ma w conditionsList, a są zaznaczone)
    const flags = [];
    if (profile.hasDiabetes) flags.push("Cukrzyca");
    if (profile.hasHypertension) flags.push("Nadciśnienie");
    if (profile.hasHeartDisease) flags.push("Choroby serca");
    if (flags.length > 0) {
      drawLine(
        `Uwagi kliniczne (flagi): ${flags.join(", ")}`,
        11,
        rgb(0.5, 0.5, 0.5)
      );
    }

    yPosition -= 15;

    // -- NORMY --
    drawLine("Twoje Indywidualne Normy:", 12, rgb(0.02, 0.6, 0.4));
    yPosition -= 2;

    const normsTextLines = getNormsText(norms);
    normsTextLines.forEach((t) => drawLine(t, 10, rgb(0.3, 0.3, 0.3)));

    yPosition -= 15;

    // -- ANALIZA AI --
    drawLine("Komentarz AI (Analiza trendów):", 14, rgb(0.02, 0.6, 0.4));
    yPosition -= 5;

    if (summary) {
      const paragraphs = summary.split("\n").filter((l) => l.trim().length > 0);
      paragraphs.forEach((p) => {
        // Usuwamy ewentualne pozostałości markdowna
        const clean = p
          .replace(/\*\*/g, "")
          .replace(/\*/g, "-")
          .replace(/#/g, "");
        drawLine(clean, 11);
      });
    } else {
      drawLine("Brak wystarczających danych do wygenerowania analizy.", 11);
    }

    yPosition -= 20;

    // -- LISTA POMIARÓW --
    drawLine("Dziennik Ostatnich Pomiarów:", 14, rgb(0.02, 0.6, 0.4));
    yPosition -= 5;

    if (user.measurements.length > 0) {
      user.measurements.forEach((m) => {
        const mDate = new Date(m.createdAt).toLocaleDateString("pl-PL", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });

        let lineText = "";
        let isAlarming = false;

        // Logika wyświetlania zależna od typu pomiaru (Enumy z Prisma)
        switch (m.type) {
          case "BLOOD_PRESSURE":
            const sys = m.value;
            const dia = m.value2; // value2 to rozkurczowe
            lineText = `• ${mDate} | Ciśnienie: ${sys}/${dia} mmHg`;
            // Sprawdzanie przekroczeń
            if (norms.systolicMax && sys > norms.systolicMax) isAlarming = true;
            if (norms.diastolicMax && dia > norms.diastolicMax)
              isAlarming = true;
            break;

          case "GLUCOSE":
            lineText = `• ${mDate} | Glukoza: ${m.value} mg/dL`;
            if (m.context) lineText += ` (${m.context})`; // np. "Na czczo"

            // Prosta logika alarmowa dla glukozy
            if (norms.glucoseFastingMax && m.value > norms.glucoseFastingMax) {
              // Jeśli kontekst to "po posiłku", można by sprawdzać glucosePostMealMax
              isAlarming = true;
            }
            break;

          case "WEIGHT":
            lineText = `• ${mDate} | Waga: ${m.value} kg`;
            break;

          case "HEART_RATE":
            lineText = `• ${mDate} | Tętno: ${m.value} bpm`;
            if (norms.pulseMax && m.value > norms.pulseMax) isAlarming = true;
            break;

          default:
            // Fallback dla innych typów
            lineText = `• ${mDate} | ${m.type}: ${m.value}`;
        }

        if (m.note) lineText += ` – "${m.note}"`;

        if (isAlarming) {
          lineText += " [!]";
          drawLine(lineText, 10, rgb(0.8, 0, 0)); // Czerwony kolor dla alarmów
        } else {
          drawLine(lineText, 10);
        }
      });
    } else {
      drawLine("Brak zapisanych pomiarów w historii.", 11);
    }

    // Stopka
    page.drawText(
      "Raport wygenerowany przez system Agent Zdrowie. Nie stanowi porady lekarskiej.",
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
    const fileName = `Raport_${safeDate}.pdf`;

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
