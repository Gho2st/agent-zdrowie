import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  // 1. Walidacja sesji
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Pobranie Usera wraz z Normami (zagnieżdżone)
    // Szukamy po emailu dla bezpieczeństwa
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true, // Potrzebne do pobrania pomiarów
        healthProfile: {
          select: {
            norms: {
              select: {
                weightMin: true,
                weightMax: true,
                systolicMin: true,
                systolicMax: true,
                glucoseFastingMin: true,
                glucoseFastingMax: true,
                pulseMin: true,
                pulseMax: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Użytkownik nie istnieje" },
        { status: 404 }
      );
    }

    // 3. Pobranie ostatnich pomiarów
    // Pobieramy trochę więcej (20), żeby mieć pewność, że trafimy na każdy typ
    const lastMeasurements = await prisma.measurement.findMany({
      where: { userId: user.id }, // user.id jest Stringiem (CUID)
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // 4. Mapowanie ostatnich wartości (Enumy + value/value2)
    const findMeasurement = (type) =>
      lastMeasurements.find((m) => m.type === type);

    const weightM = findMeasurement("WEIGHT");
    const pressureM = findMeasurement("BLOOD_PRESSURE");
    const glucoseM = findMeasurement("GLUCOSE");
    const pulseM = findMeasurement("HEART_RATE");

    // 5. Przygotowanie spłaszczonego obiektu norm (zgodność z frontendem)
    // Jeśli user nie ma profilu/norm, zwracamy pusty obiekt lub null
    const norms = user.healthProfile?.norms || {};

    return NextResponse.json({
      // Frontend oczekuje obiektu "user" z polami weightMin, systolicMax itp.
      user: norms,

      values: {
        weight: weightM ? weightM.value : null,

        // Ciśnienie ma value (skurczowe) i value2 (rozkurczowe)
        systolic: pressureM ? pressureM.value : null,
        diastolic: pressureM ? pressureM.value2 : null,

        glucose: glucoseM ? glucoseM.value : null,
        pulse: pulseM ? pulseM.value : null,
      },
    });
  } catch (err) {
    console.error("Błąd pobierania celów:", err);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
