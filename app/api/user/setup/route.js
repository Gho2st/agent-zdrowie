import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getHealthNorms } from "@/lib/norms"; // Upewnij się, że ta funkcja zwraca obiekt pasujący do modelu HealthNorms!

// Funkcja pomocnicza do obliczania wieku
function calculateAge(birthdate) {
  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// Mapowanie wartości z Frontendu na Enumy Prisma
const GENDER_MAP = {
  M: "MALE",
  K: "FEMALE",
  MALE: "MALE",
  FEMALE: "FEMALE",
};

const ACTIVITY_MAP = {
  niski: "LOW",
  umiarkowany: "MODERATE",
  wysoki: "HIGH",
  LOW: "LOW",
  MODERATE: "MODERATE",
  HIGH: "HIGH",
};

export async function PATCH(req) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Nieautoryzowany dostęp" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { birthdate, gender, height, weight, activityLevel, conditions } =
      body;

    // --- WALIDACJA ---

    if (!birthdate || isNaN(new Date(birthdate).getTime())) {
      return NextResponse.json(
        { error: "Nieprawidłowa data urodzenia" },
        { status: 400 }
      );
    }

    // Sprawdzamy czy płeć jest w mapie (obsługuje M/K oraz MALE/FEMALE)
    const dbGender = GENDER_MAP[gender];
    if (!dbGender) {
      return NextResponse.json(
        { error: "Nieprawidłowa płeć" },
        { status: 400 }
      );
    }

    if (height < 50 || height > 250) {
      return NextResponse.json(
        { error: "Wzrost musi być między 50 a 250 cm" },
        { status: 400 }
      );
    }

    if (weight < 20 || weight > 300) {
      return NextResponse.json(
        { error: "Waga musi być między 20 a 300 kg" },
        { status: 400 }
      );
    }

    // Sprawdzamy poziom aktywności
    const dbActivity = ACTIVITY_MAP[activityLevel];
    if (!dbActivity) {
      return NextResponse.json(
        { error: "Nieprawidłowy poziom aktywności" },
        { status: 400 }
      );
    }

    // Parsowanie chorób (zakładamy string po przecinku lub tablicę)
    let conditionsArray = [];
    if (typeof conditions === "string") {
      conditionsArray = conditions
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
    } else if (Array.isArray(conditions)) {
      conditionsArray = conditions.map((c) => c.trim()).filter(Boolean);
    }

    // --- LOGIKA BIZNESOWA ---

    const age = calculateAge(birthdate);

    // Obliczenie norm.
    // UWAGA: Upewnij się, że getHealthNorms zwraca obiekt z kluczami takimi jak w modelu HealthNorms
    // (np. systolicMax, bmi, glucoseFastingMax itd.)
    const normsData = getHealthNorms(
      age,
      dbGender, // Przekazujemy MALE/FEMALE
      height,
      weight,
      dbActivity, // Przekazujemy LOW/MODERATE/HIGH
      conditionsArray
    );

    if (normsData.error) {
      return NextResponse.json({ error: normsData.error }, { status: 400 });
    }

    // Pobieramy ID użytkownika na podstawie maila (niezbędne do relacji)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Użytkownik nie istnieje" },
        { status: 404 }
      );
    }

    // --- ZAPIS DO BAZY (Transakcja implicite przez zagnieżdżone pisanie) ---

    // Używamy upsert na HealthProfile
    // To utworzy profil jeśli nie istnieje, lub zaktualizuje jeśli istnieje.
    await prisma.healthProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        birthdate: new Date(birthdate),
        gender: dbGender,
        height: Number(height),
        weight: Number(weight),
        activityLevel: dbActivity,
        // Tworzenie relacji z chorobami
        conditions: {
          connectOrCreate: conditionsArray.map((name) => ({
            where: { name: name },
            create: { name: name },
          })),
        },
        // Tworzenie powiązanych norm
        norms: {
          create: normsData,
        },
      },
      update: {
        birthdate: new Date(birthdate),
        gender: dbGender,
        height: Number(height),
        weight: Number(weight),
        activityLevel: dbActivity,
        // Aktualizacja chorób: czyścimy stare (set: []) i dodajemy aktualne
        conditions: {
          set: [],
          connectOrCreate: conditionsArray.map((name) => ({
            where: { name: name },
            create: { name: name },
          })),
        },
        // Aktualizacja norm
        norms: {
          upsert: {
            create: normsData,
            update: normsData,
          },
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Błąd aktualizacji profilu:", error);
    return NextResponse.json(
      { error: "Wewnętrzny błąd serwera" },
      { status: 500 }
    );
  }
}
