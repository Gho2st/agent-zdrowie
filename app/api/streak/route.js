import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

function dayISOInTZ(date, tz) {
  return tz
    ? date.toLocaleDateString("sv-SE", { timeZone: tz })
    : date.toLocaleDateString("sv-SE");
}

function daysAgoISO(offset, tz) {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return dayISOInTZ(d, tz);
}

export async function GET() {
  const session = await auth();

  // 1. Sprawdzenie sesji po emailu
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Pobranie ID użytkownika na podstawie emaila
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({
        streakCount: 0,
        lastEntryDate: null,
        history: [],
      });
    }

    const userId = user.id;
    const userTimeZone = "Europe/Warsaw";

    // 3. Pobieranie pomiarów
    // weźmy zapas 90 dni, żeby streak >30 też działał.
    const lookbackDays = 90;
    const since = new Date();
    since.setDate(since.getDate() - lookbackDays);

    const measurements = await prisma.measurement.findMany({
      where: {
        userId: userId,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    if (measurements.length === 0) {
      return NextResponse.json({
        streakCount: 0,
        lastEntryDate: null,
        history: [],
      });
    }

    // 4. Logika obliczania (bez zmian, operuje na datach)

    const daySet = new Set();
    for (const m of measurements) {
      daySet.add(dayISOInTZ(new Date(m.createdAt), userTimeZone));
    }

    // Najnowsza data wpisu
    const sortedDays = Array.from(daySet).sort((a, b) => (a < b ? 1 : -1));
    const lastEntryDate = sortedDays[0] ?? null;

    // Startuj od "dziś" jeśli jest wpis; inaczej od "wczoraj"; inaczej 0.
    const today = daysAgoISO(0, userTimeZone);
    const yesterday = daysAgoISO(1, userTimeZone);

    let streakCount = 0;
    let startOffset = null;

    if (daySet.has(today)) startOffset = 0;
    else if (daySet.has(yesterday)) startOffset = 1;
    else startOffset = null;

    if (startOffset !== null) {
      streakCount = 1; // liczymy dzień startowy
      for (let k = startOffset + 1; ; k++) {
        const day = daysAgoISO(k, userTimeZone);
        if (daySet.has(day)) streakCount++;
        else break;
      }
    }

    // History do UI: daty z ostatnich 30 dni, w których był wpis
    const historyWindow = 30;
    const history = [];
    for (let k = 0; k < historyWindow; k++) {
      const iso = daysAgoISO(k, userTimeZone);
      if (daySet.has(iso)) history.push(iso);
    }

    return NextResponse.json({
      streakCount,
      lastEntryDate,
      history,
    });
  } catch (err) {
    console.error("Błąd podczas obliczania streaka:", err);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
