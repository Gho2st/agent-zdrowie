import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  //  Walidacja sesji
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        healthProfile: {
          select: {
            norms: {
              select: {
                weightMin: true,
                weightMax: true,
                systolicMin: true,
                optimalSystolicMax: true,
                diastolicMin: true,
                optimalDiastolicMax: true,
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

    //  Pobranie ostatnich pomiarów
    const lastMeasurements = await prisma.measurement.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const findMeasurement = (type) =>
      lastMeasurements.find((m) => m.type === type);

    const weightM = findMeasurement("WEIGHT");
    const pressureM = findMeasurement("BLOOD_PRESSURE");
    const glucoseM = findMeasurement("GLUCOSE");
    const pulseM = findMeasurement("HEART_RATE");

    const norms = user.healthProfile?.norms || {};

    return NextResponse.json({
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
