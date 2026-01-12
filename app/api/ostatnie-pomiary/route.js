import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userData = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        healthProfile: {
          include: {
            norms: true,
          },
        },
      },
    });

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const measurements = await prisma.measurement.findMany({
      where: { userId: userData.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        type: true,
        value: true,
        value2: true,
        unit: true,
        createdAt: true,
        context: true,
      },
    });

    // Obliczanie statusu względem indywidualnych norm użytkownika
    const enrichedMeasurements = measurements.map((measurement) => {
      const norms = userData.healthProfile?.norms;

      if (!norms) {
        return {
          ...measurement,
          status: "unknown",
          statusLabel: "brak norm",
          reference: null,
        };
      }

      let status = "normal";
      let statusLabel = "w normie";
      let reference = null;

      switch (measurement.type) {
        case "BLOOD_PRESSURE": {
          const systolic = Number(measurement.value);
          const diastolic = Number(measurement.value2 ?? 0);

          reference = `${norms.systolicMax}/${norms.diastolicMax}`;

          if (systolic > norms.systolicMax || diastolic > norms.diastolicMax) {
            status = "high";
            statusLabel = "podwyższone";
          } else if (
            systolic < norms.systolicMin ||
            diastolic < norms.diastolicMin
          ) {
            status = "low";
            statusLabel = "niskie";
          }
          break;
        }

        case "GLUCOSE": {
          const value = Number(measurement.value);
          reference = `${norms.glucoseFastingMin}–${norms.glucoseFastingMax}`;

          if (value > norms.glucoseFastingMax) {
            status = "high";
            statusLabel = "podwyższona";
          } else if (value < norms.glucoseFastingMin) {
            status = "low";
            statusLabel = "niska";
          }
          break;
        }

        case "HEART_RATE": {
          const value = Number(measurement.value);
          reference = `${norms.pulseMin}–${norms.pulseMax}`;

          if (value > norms.pulseMax) {
            status = "high";
            statusLabel = "przyspieszone";
          } else if (value < norms.pulseMin) {
            status = "low";
            statusLabel = "zwolnione";
          }
          break;
        }

        case "WEIGHT": {
          const value = Number(measurement.value);
          reference = `${norms.weightMin.toFixed(
            1
          )} – ${norms.weightMax.toFixed(1)} kg`;

          if (value > norms.weightMax) {
            status = "high";
            statusLabel = "powyżej zakresu";
          } else if (value < norms.weightMin) {
            status = "low";
            statusLabel = "poniżej zakresu";
          }
          break;
        }

        default:
          status = "unknown";
          statusLabel = "—";
      }

      return {
        ...measurement,
        status,
        statusLabel,
        reference,
      };
    });

    return NextResponse.json(enrichedMeasurements);
  } catch (error) {
    console.error("Błąd pobierania ostatnich pomiarów:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
