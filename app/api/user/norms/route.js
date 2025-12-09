import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { getHealthNorms } from "@/lib/norms";

// --- HELPERS I MAPOWANIE ---

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

// Mapy do konwersji między Frontendem (PL/String) a Bazą (Enumy)
const ACTIVITY_MAP_TO_DB = {
  niski: "LOW",
  umiarkowany: "MODERATE",
  wysoki: "HIGH",
  LOW: "LOW",
  MODERATE: "MODERATE",
  HIGH: "HIGH",
};

const ACTIVITY_MAP_FROM_DB = {
  LOW: "niski",
  MODERATE: "umiarkowany",
  HIGH: "wysoki",
};

// Funkcja pomocnicza do "spłaszczania" obiektu HealthProfile do formatu oczekiwanego przez stary Frontend
function flattenProfileData(healthProfile) {
  if (!healthProfile) return null;

  const { norms, conditions, ...rest } = healthProfile;

  // Konwersja listy obiektów conditions [{name: "A"}, {name: "B"}] na string "A, B"
  const conditionsString = conditions
    ? conditions.map((c) => c.name).join(",")
    : "";

  return {
    ...rest,
    // Mapowanie Enuma z powrotem na polski (jeśli frontend tego wymaga)
    activityLevel:
      ACTIVITY_MAP_FROM_DB[rest.activityLevel] || rest.activityLevel,
    conditions: conditionsString,
    // Rozpakowanie norm bezpośrednio do głównego obiektu
    ...norms,
  };
}

// --- METODA GET ---

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Nieautoryzowany dostęp" },
        { status: 401 }
      );
    }

    // Pobieramy Usera wraz z HealthProfile, Normami i Chorobami
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        healthProfile: {
          include: {
            norms: true,
            conditions: true, // Pobieramy relację wiele-do-wielu
          },
        },
      },
    });

    if (!user || !user.healthProfile) {
      return NextResponse.json(
        { error: "Profil nie znaleziony" },
        { status: 404 }
      );
    }

    // Spłaszczamy dane, aby pasowały do tego, co oczekuje Twój komponent React
    const flatData = flattenProfileData(user.healthProfile);

    return NextResponse.json(flatData);
  } catch (error) {
    console.error("Błąd pobierania danych:", error);
    return NextResponse.json(
      { error: "Wewnętrzny błąd serwera" },
      { status: 500 }
    );
  }
}

// --- METODA PATCH ---

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
    const { medications, conditions, activityLevel, height, weight } = body;

    // --- WALIDACJA ---

    if (medications && medications.length > 500) {
      return NextResponse.json(
        { error: "Lista leków za długa" },
        { status: 400 }
      );
    }

    // Parsowanie chorób (string -> tablica)
    let conditionsArray = [];
    if (conditions) {
      conditionsArray = Array.isArray(conditions)
        ? conditions
        : conditions
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean);

      if (conditionsArray.some((c) => !c)) {
        return NextResponse.json(
          { error: "Puste choroby są niedozwolone" },
          { status: 400 }
        );
      }
    }

    // Mapowanie aktywności na Enum
    let dbActivity = undefined;
    if (activityLevel) {
      dbActivity = ACTIVITY_MAP_TO_DB[activityLevel];
      if (!dbActivity) {
        return NextResponse.json(
          { error: "Nieprawidłowy poziom aktywności" },
          { status: 400 }
        );
      }
    }

    if (height && (height < 50 || height > 250)) {
      return NextResponse.json(
        { error: "Wzrost musi być między 50 a 250 cm" },
        { status: 400 }
      );
    }
    if (weight && (weight < 20 || weight > 300)) {
      return NextResponse.json(
        { error: "Waga musi być między 20 a 300 kg" },
        { status: 400 }
      );
    }

    // --- POBRANIE AKTUALNEGO STANU (z HealthProfile) ---

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true, // Potrzebne ID usera do relacji
        healthProfile: {
          include: {
            conditions: true,
          },
        },
      },
    });

    if (!user || !user.healthProfile) {
      return NextResponse.json(
        { error: "Użytkownik nie posiada profilu zdrowotnego" },
        { status: 404 }
      );
    }

    const currentProfile = user.healthProfile;

    // --- PRZELICZANIE NORM ---

    let normsData = {};
    const changingRelevantData =
      height !== undefined ||
      weight !== undefined ||
      conditions !== undefined ||
      activityLevel !== undefined;

    if (changingRelevantData) {
      const age = calculateAge(currentProfile.birthdate);

      const newHeight =
        height !== undefined ? Number(height) : currentProfile.height;
      const newWeight =
        weight !== undefined ? Number(weight) : currentProfile.weight;
      const newActivity = dbActivity ?? currentProfile.activityLevel;

      // Jeśli conditions przyszło w body, używamy nowego, w przeciwnym razie starego z bazy (mapujemy obiekty na nazwy)
      const newConditionsList =
        conditions !== undefined
          ? conditionsArray
          : currentProfile.conditions.map((c) => c.name);

      // Obliczamy normy (przekazując Enumy MALE/FEMALE/LOW/HIGH itd.)
      const normsResult = getHealthNorms(
        age,
        currentProfile.gender, // Zakładamy, że to już jest Enum z bazy
        newHeight,
        newWeight,
        newActivity,
        newConditionsList
      );

      if (normsResult && normsResult.error) {
        return NextResponse.json({ error: normsResult.error }, { status: 400 });
      }
      normsData = normsResult;
    }

    // --- AKTUALIZACJA BAZY DANYCH ---

    // Przygotowanie obiektu update dla Prisma
    const updateData = {
      medications: medications !== undefined ? medications : undefined,
      height: height !== undefined ? Number(height) : undefined,
      weight: weight !== undefined ? Number(weight) : undefined,
      activityLevel: dbActivity !== undefined ? dbActivity : undefined,
    };

    // Jeśli zmieniły się choroby, musimy użyć logiki relacji (odłącz stare, połącz nowe)
    if (conditions !== undefined) {
      updateData.conditions = {
        set: [], // Odłączamy wszystkie dotychczasowe
        connectOrCreate: conditionsArray.map((name) => ({
          where: { name: name },
          create: { name: name },
        })),
      };
    }

    // Jeśli zmieniły się normy, aktualizujemy tabelę HealthNorms
    if (Object.keys(normsData).length > 0) {
      updateData.norms = {
        upsert: {
          create: normsData,
          update: normsData,
        },
      };
    }

    // Wykonanie aktualizacji na modelu HealthProfile
    const updatedProfile = await prisma.healthProfile.update({
      where: { userId: user.id },
      data: updateData,
      include: {
        norms: true,
        conditions: true,
      },
    });

    // --- ZWRÓCENIE ODPOWIEDZI ---

    // Ponownie spłaszczamy dane dla Frontendu
    const flatResponse = flattenProfileData(updatedProfile);

    return NextResponse.json(flatResponse);
  } catch (error) {
    console.error("Błąd aktualizacji danych:", error);
    return NextResponse.json(
      { error: "Wewnętrzny błąd serwera" },
      { status: 500 }
    );
  }
}
