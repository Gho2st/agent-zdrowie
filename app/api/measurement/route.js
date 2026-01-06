import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function POST(req) {
  const session = await auth();

  // Walidacja sesji
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const { amount, type, unit, systolic, diastolic, context, note } = body;

  const VALID_TYPES = new Set([
    "BLOOD_PRESSURE",
    "GLUCOSE",
    "WEIGHT",
    "HEART_RATE",
  ]);

  if (!VALID_TYPES.has(type)) {
    return NextResponse.json(
      { error: "Nieprawidłowy typ pomiaru" },
      { status: 400 }
    );
  }

  //  Przygotowanie danych (value / value2)
  let finalValue = null;
  let finalValue2 = null;

  if (dbType === "BLOOD_PRESSURE") {
    if (typeof systolic !== "number" || typeof diastolic !== "number") {
      return NextResponse.json(
        { error: "Wymagane wartości skurczowe i rozkurczowe" },
        { status: 400 }
      );
    }
    finalValue = systolic;
    finalValue2 = diastolic;
  } else {
    if (amount === undefined || amount === null || amount === "") {
      return NextResponse.json(
        { error: "Wartość nie może być pusta" },
        { status: 400 }
      );
    }
    finalValue = Number(amount);
    if (isNaN(finalValue)) {
      return NextResponse.json(
        { error: "Niepoprawna liczba" },
        { status: 400 }
      );
    }
  }

  try {
    //  Pobranie usera
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        healthProfile: {
          include: { norms: true }, // Pobieramy normy, aby sprawdzić czy istnieją
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Specjalna logika dla WAGI (aktualizacja profilu i BMI)
    if (dbType === "WEIGHT") {
      const profile = user.healthProfile;

      // Aktualizujemy tylko, jeśli użytkownik ma utworzony profil zdrowotny
      if (profile) {
        let updateData = { weight: finalValue };
        let normsUpdate = {};

        // Przeliczanie BMI, jeśli mamy wzrost w profilu
        if (profile.height && profile.height > 0) {
          const heightM = profile.height / 100;
          const bmi = parseFloat((finalValue / (heightM * heightM)).toFixed(1));

          if (profile.norms) {
            normsUpdate = {
              norms: {
                update: { bmi: bmi },
              },
            };
          }
        }

        // Aktualizacja HealthProfile
        await prisma.healthProfile.update({
          where: { id: profile.id },
          data: {
            ...updateData,
            ...normsUpdate,
          },
        });
      }
    }

    // . Zapis pomiaru w tabeli Measurement
    const measurement = await prisma.measurement.create({
      data: {
        userId: user.id,
        type: dbType,
        unit: unit || "",
        value: finalValue,
        value2: finalValue2,
        context: context || undefined,
        note: note || undefined,
      },
    });

    return NextResponse.json(measurement, { status: 200 });
  } catch (error) {
    console.error("❌ Błąd zapisu pomiaru:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) return NextResponse.json([], { status: 200 });

    const rawMeasurements = await prisma.measurement.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    const mappedMeasurements = rawMeasurements.map((m) => {
      const isBP = m.type === "BLOOD_PRESSURE";
      return {
        ...m,
        amount: isBP ? null : m.value,
        systolic: isBP ? m.value : null,
        diastolic: isBP ? m.value2 : null,
      };
    });

    return NextResponse.json(mappedMeasurements, { status: 200 });
  } catch (error) {
    console.error("Błąd pobierania:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
