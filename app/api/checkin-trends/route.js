import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(req) {
  const session = await auth();

  // 1. Walidacja sesji
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parsowanie parametrów URL
  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") || "7");

  try {
    // 3. Pobranie ID użytkownika (String CUID)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 4. Obliczenie daty początkowej
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - (days - 1));
    fromDate.setHours(0, 0, 0, 0);

    // 5. Pobranie danych
    const checkins = await prisma.dailyCheckin.findMany({
      where: {
        userId: user.id, // String
        date: {
          gte: fromDate,
        },
      },
      orderBy: {
        date: "asc",
      },
      select: {
        date: true,
        mood: true, // Dodałem mood, bo jest w schemie i warto go pokazać
        sleep: true,
        stress: true,
        energy: true,
      },
    });

    // 6. Formatowanie odpowiedzi
    const formatted = checkins.map((entry) => ({
      date: entry.date.toISOString(),
      mood: entry.mood,
      sleep: entry.sleep,
      stress: entry.stress,
      energy: entry.energy,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("❌ Błąd pobierania historii checkinów:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
