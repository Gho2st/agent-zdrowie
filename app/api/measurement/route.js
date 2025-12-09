import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

// Mapowanie typów z Frontendu (PL) na Bazę (Enums)
const TYPE_MAP = {
  ciśnienie: "BLOOD_PRESSURE",
  waga: "WEIGHT",
  cukier: "GLUCOSE",
  tętno: "HEART_RATE",
  // Obsługa też angielskich nazw, jeśli frontend wyśle
  BLOOD_PRESSURE: "BLOOD_PRESSURE",
  WEIGHT: "WEIGHT",
  GLUCOSE: "GLUCOSE",
  HEART_RATE: "HEART_RATE",
};

export async function POST(req) {
  const session = await auth();

  // 1. Walidacja sesji
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  console.log("📥 Otrzymane dane:", body);

  const { amount, type, unit, systolic, diastolic, timing, context, note } =
    body;

  // 2. Mapowanie typu
  const dbType = TYPE_MAP[type];
  if (!dbType) {
    return NextResponse.json(
      { error: "Nieznany typ pomiaru" },
      { status: 400 }
    );
  }

  // 3. Przygotowanie danych (value / value2)
  let finalValue = null; // Główne pole (systolic lub amount)
  let finalValue2 = null; // Dodatkowe pole (diastolic)

  if (dbType === "BLOOD_PRESSURE") {
    // Walidacja dla ciśnienia
    if (typeof systolic !== "number" || typeof diastolic !== "number") {
      return NextResponse.json(
        { error: "Wymagane wartości skurczowe i rozkurczowe" },
        { status: 400 }
      );
    }
    finalValue = systolic;
    finalValue2 = diastolic;
  } else {
    // Walidacja dla reszty (waga, cukier, tętno)
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
    // 4. Pobranie usera (potrzebne ID i ewentualnie HealthProfile do BMI)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        healthProfile: {
          include: { norms: true }, // Potrzebne, żeby zaktualizować BMI w norms
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 5. Logika biznesowa dla Wagi (aktualizacja profilu i BMI)
    if (dbType === "WEIGHT") {
      const profile = user.healthProfile;

      // Jeśli użytkownik ma profil, aktualizujemy w nim wagę
      if (profile) {
        let updateData = { weight: finalValue };
        let normsUpdate = {};

        // Przeliczanie BMI, jeśli mamy wzrost
        if (profile.height && profile.height > 0) {
          const heightM = profile.height / 100;
          const bmi = parseFloat((finalValue / (heightM * heightM)).toFixed(1));
          console.log("⚖️ Nowe BMI:", bmi);

          // Przygotowanie update dla tabeli norms
          // Używamy upsert, bo norms mogą jeszcze nie istnieć
          normsUpdate = {
            norms: {
              upsert: {
                create: { bmi: bmi }, // Tutaj wstawilibyśmy też domyślne normy, jeśli wymagane
                update: { bmi: bmi },
              },
            },
          };
        }

        // Aktualizacja HealthProfile (waga + relacja do norms)
        await prisma.healthProfile.update({
          where: { id: profile.id },
          data: {
            ...updateData,
            ...normsUpdate,
          },
        });
      }
    }

    // 6. Zapis pomiaru
    const measurement = await prisma.measurement.create({
      data: {
        userId: user.id, // String CUID
        type: dbType, // Enum
        unit: unit || "",
        value: finalValue, // Float
        value2: finalValue2, // Float (nullable)
        context: context || undefined,
        note: note || undefined,
        // timing: timing - usuwamy, jeśli nie ma go w nowej schemie, lub dodajemy do contextu
      },
    });

    console.log("✅ Pomiar zapisany:", measurement);
    return NextResponse.json(measurement, { status: 200 });
  } catch (error) {
    console.error("❌ Błąd zapisu:", error);
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

    // Mapowanie powrotne dla Frontendu (aby nie zepsuć widoku)
    // Frontend oczekuje: amount, systolic, diastolic
    const mappedMeasurements = rawMeasurements.map((m) => {
      const isBP = m.type === "BLOOD_PRESSURE";
      return {
        ...m,
        // Odtwarzamy stare pola
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
