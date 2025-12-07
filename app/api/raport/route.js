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

// 1. Łamanie tekstu
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

// 2. Obliczanie wieku (zgodnie ze schematem pole to 'birthdate')
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

// 3. Helper do budowania tekstu norm z bazy
const getUserNorms = (user) => {
  const norms = [];

  // Ciśnienie
  if (user.systolicMax || user.diastolicMax) {
    const sys =
      user.systolicMin && user.systolicMax
        ? `${user.systolicMin}-${user.systolicMax}`
        : `< ${user.systolicMax || "?"}`;
    const dia =
      user.diastolicMin && user.diastolicMax
        ? `${user.diastolicMin}-${user.diastolicMax}`
        : `< ${user.diastolicMax || "?"}`;
    norms.push(`• Ciśnienie docelowe: ${sys} / ${dia} mmHg`);
  }

  // Tętno
  if (user.pulseMin || user.pulseMax) {
    norms.push(
      `• Tętno: ${user.pulseMin || "?"} – ${user.pulseMax || "?"} ud./min`
    );
  }

  // Glukoza
  if (user.glucoseFastingMax) {
    norms.push(
      `• Glukoza (na czczo): ${user.glucoseFastingMin || 70} – ${
        user.glucoseFastingMax
      } mg/dL`
    );
  }
  if (user.glucosePostMealMax) {
    norms.push(`• Glukoza (po posiłku): < ${user.glucosePostMealMax} mg/dL`);
  }

  // Waga
  if (user.weightMin || user.weightMax) {
    norms.push(
      `• Waga docelowa: ${user.weightMin || "?"} – ${user.weightMax || "?"} kg`
    );
  }

  // Jeśli nie ma żadnych ustawień w bazie
  if (norms.length === 0) {
    norms.push("• Brak zdefiniowanych indywidualnych norm w profilu pacjenta.");
    norms.push("  (Zastosowano domyślne normy WHO do analizy AI)");
  }

  return norms;
};

export async function POST() {
  const session = await auth();
  if (!session?.user?.email)
    return new Response("Unauthorized", { status: 401 });

  // Pobieramy usera ze wszystkimi polami norm
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      measurements: {
        take: 30, // Więcej pomiarów dla lepszej analizy
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) return new Response("User not found", { status: 404 });

  const context = buildPersonalizedContext(user);

  // === PROMPT DO AI ===
  // Przekazujemy AI informację o zdefiniowanych normach użytkownika, aby analiza była spójna z tym co wydrukujemy
  const { text: summary } = await generateText({
    model: openai("gpt-4o"),
    temperature: 0.2,
    prompt: `Jesteś asystentem medycznym AI przygotowującym raport dla lekarza.
    NIE udawaj lekarza. Pisz technicznie i zwięźle.
    
    DANE PACJENTA:
    ${context}

    ZADANIE:
    1. Przeanalizuj ostatnie pomiary w odniesieniu do indywidualnych norm pacjenta (jeśli są podane w kontekście) lub norm ogólnych.
    2. Wykryj trendy (wzrostowe/spadkowe).
    3. Wskaż pomiary przekraczające zdefiniowane limity (np. systolicMax).
    4. Nie używaj Markdown.
    `,
  });

  // === GENEROWANIE PDF ===
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  // Załaduj font (upewnij się, że plik istnieje w public/fonts)
  const fontBytes = await fs.readFile(
    path.join(process.cwd(), "public/fonts/Roboto-Regular.ttf")
  );
  const font = await pdfDoc.embedFont(fontBytes);

  let page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  const margin = 50;
  const contentWidth = width - margin * 2;

  let yPosition = height - 120;

  // Funkcja rysująca linię
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

  // 1. NAGŁÓWEK
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

  const today = new Date().toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  page.drawText(`Data generowania: ${today}`, {
    x: margin,
    y: height - 80,
    size: 10,
    font,
    color: rgb(0.9, 0.9, 0.9),
  });

  // 2. DANE OSOBOWE I BIOMETRIA
  drawLine("Dane identyfikacyjne:", 14, rgb(0.07, 0.45, 0.85));
  yPosition -= 5;

  const age = calculateAge(user.birthdate); // Używam pola 'birthdate' ze schematu
  let headerInfo = `• Pacjent: ${user.name || user.email}`;
  if (age) headerInfo += `   • Wiek: ${age} lat`;
  if (user.gender) headerInfo += `   • Płeć: ${user.gender}`;

  drawLine(headerInfo, 11);

  let bioInfo = "";
  if (user.height) bioInfo += `• Wzrost: ${user.height} cm   `;
  if (user.weight) bioInfo += `• Waga obecna: ${user.weight} kg   `;
  if (user.bmi) bioInfo += `• BMI: ${user.bmi.toFixed(1)}`; // Zakładam, że BMI jest wyliczane przy zapisie usera

  if (bioInfo) drawLine(bioInfo, 11);
  if (user.conditions) drawLine(`• Choroby przewlekłe: ${user.conditions}`, 11);
  if (user.medications) drawLine(`• Leki: ${user.medications}`, 11);

  yPosition -= 15;

  // 3. INDYWIDUALNE NORMY (Z BAZY)
  drawLine("Indywidualne cele terapeutyczne:", 12, rgb(0.07, 0.45, 0.85));
  yPosition -= 2;

  const userNorms = getUserNorms(user);
  userNorms.forEach((norm) => {
    // Rysujemy na szaro, żeby odróżnić od wyników
    drawLine(norm, 10, rgb(0.3, 0.3, 0.3));
  });

  yPosition -= 15;

  // 4. ANALIZA AI
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

  // 5. TABELA POMIARÓW
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

      let lineText = `• ${mDate} | ${m.type.toUpperCase()}: `;
      let isAlarming = false;

      // Formatowanie wartości w zależności od typu
      if (m.type === "ciśnienie" || (m.systolic && m.diastolic)) {
        lineText += `${m.systolic}/${m.diastolic} mmHg`;
        // Sprawdzanie przekroczeń względem norm usera (jeśli są)
        if (user.systolicMax && m.systolic > user.systolicMax)
          isAlarming = true;
        if (user.diastolicMax && m.diastolic > user.diastolicMax)
          isAlarming = true;
      } else if (m.amount) {
        lineText += `${m.amount} ${m.unit}`;

        // Logika dla glukozy
        if (
          m.type === "glukoza" &&
          user.glucoseFastingMax &&
          m.amount > user.glucoseFastingMax
        ) {
          isAlarming = true;
        }
      }

      if (m.context) lineText += ` (${m.context})`;

      // Jeśli wynik jest alarmujący, dodajemy wykrzyknik i ewentualnie zmieniamy kolor (pdf-lib wymaga zmiany koloru dla całego drawText, więc tu dodamy tylko tekst)
      if (isAlarming) {
        lineText += " (!)";
        drawLine(lineText, 10, rgb(0.8, 0, 0)); // Czerwony dla ostrzeżeń
      } else {
        drawLine(lineText, 10);
      }
    });
  } else {
    drawLine("Brak zapisanych pomiarów.", 11);
  }

  // STOPKA
  const footerY = 30;
  page.drawText(
    "Dokument wygenerowany automatycznie przez system Agent Zdrowie.",
    {
      x: margin,
      y: footerY,
      size: 8,
      font,
      color: rgb(0.6, 0.6, 0.6),
    }
  );

  const pdfBytes = await pdfDoc.save();

  // Generujemy bezpieczną nazwę pliku z datą (RRRR-MM-DD)
  const safeDate = new Date().toISOString().slice(0, 10);
  const fileName = `Raport_Medyczny_${safeDate}.pdf`;

  return new Response(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      // Używamy backticków (`), aby wstawić zmienną do ciągu znaku
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
