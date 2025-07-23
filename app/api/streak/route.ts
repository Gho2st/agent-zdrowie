import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt(session.user.id);

  try {
    const measurements = await prisma.measurement.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (measurements.length === 0) {
      return NextResponse.json({ streakCount: 0, lastEntryDate: null });
    }

    const uniqueDates = Array.from(
      new Set(
        measurements.map((m) =>
          new Date(m.createdAt).toISOString().slice(0, 10)
        )
      )
    ).sort((a, b) => (a < b ? 1 : -1)); // malejąco

    let streak = 0;
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    // Jeśli ostatni pomiar był dzisiaj — sprawdzamy od dzisiaj
    // Jeśli nie — ale był wczoraj, nadal liczmy streak
    let startIndex = 0;
    if (!uniqueDates.includes(today) && uniqueDates.includes(yesterdayStr)) {
      startIndex = 1;
    }

    for (let i = startIndex; i < uniqueDates.length; i++) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      const expectedStr = expectedDate.toISOString().slice(0, 10);

      if (uniqueDates.includes(expectedStr)) {
        streak++;
      } else {
        break;
      }
    }

    const lastEntryDate = uniqueDates[0] || null;

    return NextResponse.json({
      streakCount: streak,
      lastEntryDate,
    });
  } catch (err) {
    console.error("Błąd podczas obliczania streaka:", err);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
