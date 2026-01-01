import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getHealthNorms } from "@/lib/norms";

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

const GENDER_MAP = {
  MALE: "MALE",
  FEMALE: "FEMALE",
};

const ACTIVITY_MAP = {
  LOW: "LOW",
  MODERATE: "MODERATE",
  HIGH: "HIGH",
};

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Nieautoryzowany dostęp" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const {
      birthdate,
      gender,
      height,
      weight,
      activityLevel,
      hasDiabetes,
      hasPrediabetes,
      hasHypertension,
      hasHeartDisease,
      hasKidneyDisease,
    } = body;

    if (!birthdate || isNaN(new Date(birthdate).getTime())) {
      return NextResponse.json(
        { error: "Nieprawidłowa data urodzenia" },
        { status: 400 }
      );
    }

    const age = calculateAge(birthdate);
    if (age < 18) {
      return NextResponse.json(
        {
          error:
            "Musisz mieć ukończone 18 lat, aby korzystać z tej aplikacji.",
          details: `Podana data urodzenia wskazuje na wiek ${age} lat.`,
        },
        { status: 403 } // Forbidden 
      );
    }

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

    const dbActivity = ACTIVITY_MAP[activityLevel];
    if (!dbActivity) {
      return NextResponse.json(
        { error: "Nieprawidłowy poziom aktywności" },
        { status: 400 }
      );
    }

    // Obliczamy normy na podstawie danych użytkownika
    const normsData = getHealthNorms(
      age,
      dbGender,
      height,
      weight,
      dbActivity,
      hasDiabetes,
      hasHypertension,
      hasHeartDisease,
      hasKidneyDisease,
      hasPrediabetes
    );

    if (normsData.error) {
      return NextResponse.json({ error: normsData.error }, { status: 400 });
    }

    // Szukamy ID użytkownika na podstawie maila z sesji
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Użytkownik nie istnieje w bazie danych" },
        { status: 404 }
      );
    }

    await prisma.healthProfile.create({
      data: {
        userId: user.id,
        birthdate: new Date(birthdate),
        gender: dbGender,
        height: Number(height),
        weight: Number(weight),
        activityLevel: dbActivity,

        // Flagi zdrowotne
        hasDiabetes: Boolean(hasDiabetes),
        hasPrediabetes: Boolean(hasPrediabetes),
        hasHypertension: Boolean(hasHypertension),
        hasHeartDisease: Boolean(hasHeartDisease),
        hasKidneyDisease: Boolean(hasKidneyDisease),

        // Tworzenie rekordu w powiązanej tabeli Norms
        norms: {
          create: normsData,
        },
      },
    });

    return NextResponse.json(
      { success: true, message: "Profil stworzony pomyślnie" },
      { status: 201 }
    );
  } catch (error) {
    // Obsługa błędu unikalności (jeśli profil już istnieje)
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Profil zdrowia dla tego konta już istnieje." },
        { status: 409 }
      );
    }

    console.error("Błąd podczas tworzenia profilu:", error);
    return NextResponse.json(
      { error: "Wewnętrzny błąd serwera" },
      { status: 500 }
    );
  }
}