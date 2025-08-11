// app/api/streak/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

// Helpers (bez zależności)
function dayISOInTZ(date: Date, tz?: string) {
  // 'sv-SE' => YYYY-MM-DD
  return tz
    ? date.toLocaleDateString("sv-SE", { timeZone: tz })
    : date.toLocaleDateString("sv-SE");
}
function daysAgoISO(offset: number, tz?: string) {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return dayISOInTZ(d, tz);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt(String(session.user.id), 10);
  const userTimeZone: string = "Europe/Warsaw";

  try {
    // Ile dni wstecz naprawdę potrzebujesz do UI — 30 wystarczy do kropek,
    // ale weźmy zapas, żeby streak >30 też działał.
    const lookbackDays = 400;
    const since = new Date();
    since.setDate(since.getDate() - lookbackDays);

    const measurements = await prisma.measurement.findMany({
      where: { userId, createdAt: { gte: since } },
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

    // Zbiór unikalnych dni (YYYY-MM-DD) w TZ użytkownika
    const daySet = new Set<string>();
    for (const m of measurements) {
      daySet.add(dayISOInTZ(new Date(m.createdAt), userTimeZone));
    }

    // Najnowsza data wpisu
    const lastEntryDate =
      Array.from(daySet).sort((a, b) => (a < b ? 1 : -1))[0] ?? null;

    // Wylicz streak:
    // Startuj od "dziś" jeśli jest wpis; inaczej od "wczoraj"; inaczej 0.
    const today = daysAgoISO(0, userTimeZone);
    const yesterday = daysAgoISO(1, userTimeZone);

    let streakCount = 0;
    let startOffset: number | null = null;

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
    const history: string[] = [];
    for (let k = 0; k < historyWindow; k++) {
      const iso = daysAgoISO(k, userTimeZone);
      if (daySet.has(iso)) history.push(iso);
    }

    return NextResponse.json({
      streakCount,
      lastEntryDate,
      history, // np. ["2025-08-11","2025-08-10", ...]
    });
  } catch (err) {
    console.error("Błąd podczas obliczania streaka:", err);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
