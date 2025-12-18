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

// Mapujemy wejście na bazę (zabezpieczenie na wypadek gdyby frontend wysłał 'niski' zamiast 'LOW')
const ACTIVITY_MAP_TO_DB = {
  niski: "LOW",
  umiarkowany: "MODERATE",
  wysoki: "HIGH",
  LOW: "LOW",
  MODERATE: "MODERATE",
  HIGH: "HIGH",
};

// Funkcja spłaszczająca - USUNĄŁEM MAPOWANIE NA POLSKI
function flattenProfileData(healthProfile) {
  if (!healthProfile) return null;

  const { norms, conditions, ...rest } = healthProfile;

  const conditionsString = conditions
    ? conditions.map((c) => c.name).join(",")
    : "";

  return {
    ...rest,
    // TU BYŁ BŁĄD: zwracamy surowy ENUM (np. "HIGH"), a nie "wysoki"
    activityLevel: rest.activityLevel,
    conditions: conditionsString,
    ...norms,
  };
}

// --- METODA GET ---

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        healthProfile: {
          include: {
            norms: true,
            conditions: true,
          },
        },
      },
    });

    if (!user || !user.healthProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(flattenProfileData(user.healthProfile));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// --- METODA PATCH ---

export async function PATCH(req) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      medications,
      conditions,
      activityLevel,
      height,
      weight,
      hasDiabetes,
      hasPrediabetes,
      hasHypertension,
      hasHeartDisease,
      hasKidneyDisease,
    } = body;

    let conditionsArray = [];
    if (conditions) {
      conditionsArray = Array.isArray(conditions)
        ? conditions
        : conditions
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean);
    }

    // Mapujemy wartość na ENUM (np. jeśli przyjdzie "HIGH" to zostaje "HIGH")
    let dbActivity = undefined;
    if (activityLevel) {
      dbActivity = ACTIVITY_MAP_TO_DB[activityLevel];
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, healthProfile: { include: { conditions: true } } },
    });

    if (!user?.healthProfile) {
      return NextResponse.json({ error: "No profile" }, { status: 404 });
    }
    const currentProfile = user.healthProfile;

    // Przeliczanie norm
    let normsData = {};
    const changingRelevantData =
      height !== undefined ||
      weight !== undefined ||
      activityLevel !== undefined ||
      hasDiabetes !== undefined ||
      hasPrediabetes !== undefined ||
      hasHypertension !== undefined ||
      hasHeartDisease !== undefined ||
      hasKidneyDisease !== undefined;

    if (changingRelevantData) {
      const age = calculateAge(currentProfile.birthdate);
      const newHeight =
        height !== undefined ? Number(height) : currentProfile.height;
      const newWeight =
        weight !== undefined ? Number(weight) : currentProfile.weight;
      const newActivity = dbActivity ?? currentProfile.activityLevel;

      const newHasDiabetes =
        hasDiabetes !== undefined
          ? Boolean(hasDiabetes)
          : currentProfile.hasDiabetes;
      const newHasPrediabetes =
        hasPrediabetes !== undefined
          ? Boolean(hasPrediabetes)
          : currentProfile.hasPrediabetes;
      const newHasHypertension =
        hasHypertension !== undefined
          ? Boolean(hasHypertension)
          : currentProfile.hasHypertension;
      const newHasHeartDisease =
        hasHeartDisease !== undefined
          ? Boolean(hasHeartDisease)
          : currentProfile.hasHeartDisease;
      const newHasKidneyDisease =
        hasKidneyDisease !== undefined
          ? Boolean(hasKidneyDisease)
          : currentProfile.hasKidneyDisease;

      // Tutaj ważne: przekazujemy newActivity, które jest ENUMem (np. "HIGH")
      const normsResult = getHealthNorms(
        age,
        currentProfile.gender,
        newHeight,
        newWeight,
        newActivity,
        newHasDiabetes,
        newHasHypertension,
        newHasHeartDisease,
        newHasKidneyDisease,
        newHasPrediabetes
      );

      if (normsResult.error) {
        return NextResponse.json({ error: normsResult.error }, { status: 400 });
      }
      normsData = normsResult;
    }

    const updateData = {
      medications: medications !== undefined ? medications : undefined,
      height: height !== undefined ? Number(height) : undefined,
      weight: weight !== undefined ? Number(weight) : undefined,
      activityLevel: dbActivity !== undefined ? dbActivity : undefined,
      hasDiabetes: hasDiabetes !== undefined ? Boolean(hasDiabetes) : undefined,
      hasPrediabetes:
        hasPrediabetes !== undefined ? Boolean(hasPrediabetes) : undefined,
      hasHypertension:
        hasHypertension !== undefined ? Boolean(hasHypertension) : undefined,
      hasHeartDisease:
        hasHeartDisease !== undefined ? Boolean(hasHeartDisease) : undefined,
      hasKidneyDisease:
        hasKidneyDisease !== undefined ? Boolean(hasKidneyDisease) : undefined,
    };

    if (conditions !== undefined) {
      updateData.conditions = {
        set: [],
        connectOrCreate: conditionsArray.map((name) => ({
          where: { name: name },
          create: { name: name },
        })),
      };
    }

    if (Object.keys(normsData).length > 0) {
      updateData.norms = {
        upsert: { create: normsData, update: normsData },
      };
    }

    const updatedProfile = await prisma.healthProfile.update({
      where: { userId: user.id },
      data: updateData,
      include: { norms: true, conditions: true },
    });

    return NextResponse.json(flattenProfileData(updatedProfile));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
