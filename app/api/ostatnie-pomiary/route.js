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
    const rawMeasurements = await prisma.measurement.findMany({
      where: { userId: user.id }, // user.id jest Stringiem
      orderBy: { createdAt: "desc" },
      take: 7,
      select: {
        id: true,
        type: true, // Enum: BLOOD_PRESSURE, WEIGHT, etc.
        value: true,
        value2: true,
        unit: true,
        createdAt: true,
        context: true, // np. "Na czczo"
      },
    });

    // 4. Formatowanie danych dla Frontendu
    // Mapujemy generyczne 'value/value2' na nazwy zrozumiałe dla UI
    const formattedMeasurements = rawMeasurements.map((m) => {
      let details = {};

      switch (m.type) {
        case "BLOOD_PRESSURE":
          details = {
            systolic: m.value, // Ciśnienie skurczowe
            diastolic: m.value2, // Ciśnienie rozkurczowe
            display: `${m.value}/${m.value2}`,
          };
          break;
        case "WEIGHT":
        case "GLUCOSE":
        case "HEART_RATE":
          details = {
            amount: m.value,
            display: `${m.value}`,
          };
          break;
        default:
          details = {
            amount: m.value,
            display: `${m.value}`,
          };
      }

      return {
        id: m.id,
        type: m.type, // Zwraca np. "BLOOD_PRESSURE"
        unit: m.unit,
        createdAt: m.createdAt,
        context: m.context,
        ...details, // Rozpakowujemy: amount lub systolic/diastolic
      };
    });

    return NextResponse.json(formattedMeasurements, { status: 200 });
  } catch (error) {
    console.error("Błąd pobierania pomiarów:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
