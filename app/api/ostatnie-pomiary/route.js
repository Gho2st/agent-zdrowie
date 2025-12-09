import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  // 1. Walidacja sesji po emailu
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Pobranie ID użytkownika (String CUID)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3. Pobranie ostatnich pomiarów
    const measurements = await prisma.measurement.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5, // Pobieramy np. 5 ostatnich do kafelka
      select: {
        id: true,
        type: true, // Enum: BLOOD_PRESSURE, WEIGHT, etc.
        value: true, // Główne pole (Waga, Cukier, Skurczowe)
        value2: true, // Dodatkowe pole (Rozkurczowe)
        unit: true,
        createdAt: true,
        context: true,
      },
    });

    // 4. Zwracamy dane BEZ mapowania
    // Frontend jest już mądry i sam obsłuży pola 'value' i 'value2'
    return NextResponse.json(measurements, { status: 200 });
  } catch (error) {
    console.error("Błąd pobierania pomiarów:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
