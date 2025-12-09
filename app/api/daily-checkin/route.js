import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

// Helper do normalizacji daty (ustawia godzinę na 00:00:00 lokalnego czasu serwera)
// Dzięki temu unikalny constraint [userId, date] działa jak "jeden wpis na dzień"
const getTodayNormalized = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

export async function GET() {
  const session = await auth();

  // 1. Walidacja sesji
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Pobranie ID użytkownika (String)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3. Pobranie wpisu dla dzisiejszej daty
    const today = getTodayNormalized();

    const checkin = await prisma.dailyCheckin.findUnique({
      where: {
        userId_date: {
          userId: user.id, // String CUID
          date: today,
        },
      },
    });

    return NextResponse.json(
      checkin ? { ...checkin, date: checkin.date.toISOString() } : null,
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Błąd pobierania DailyCheckin:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await auth();

  // 1. Walidacja sesji
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { mood, sleep, energy, stress } = body;

  try {
    // 2. Pobranie ID użytkownika (String)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3. Upsert (Utwórz lub Aktualizuj)
    const today = getTodayNormalized();

    const saved = await prisma.dailyCheckin.upsert({
      where: {
        userId_date: {
          userId: user.id, // String CUID
          date: today,
        },
      },
      update: {
        mood,
        sleep,
        energy,
        stress,
      },
      create: {
        userId: user.id, // String CUID
        date: today, // Ważne: zapisujemy z godziną 00:00:00, żeby unique constraint działał
        mood,
        sleep,
        energy,
        stress,
      },
    });

    return NextResponse.json(saved, { status: 200 });
  } catch (err) {
    console.error("❌ Błąd przy zapisie DailyCheckin:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
