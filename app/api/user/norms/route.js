import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { getHealthNorms } from "@/lib/norms";

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

const VALID_ACTIVITY_LEVELS = new Set(["LOW", "MODERATE", "HIGH"]);

function flattenProfileData(healthProfile) {
  if (!healthProfile) return null;

  const { norms, conditions, ...rest } = healthProfile;

  const conditionsString = conditions
    ? conditions.map((c) => c.name).join(", ")
    : "";

  return {
    ...rest,
    activityLevel: rest.activityLevel,
    conditions: conditionsString,
    ...norms,
  };
}

// --- GET pobieranie profilu z normami ---
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
    console.error("Błąd pobierania profilu:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// --- PATCH aktualizacja profilu z przeliczeniem norm ---
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

    // Przygotowanie danych do aktualizacji
    const updateData = {};

    // Walidacja i konwersja liczbowych pól
    if (height !== undefined) {
      const h = Number(height);
      if (isNaN(h) || h <= 0) {
        return NextResponse.json(
          { error: "Wzrost musi być dodatnią liczbą" },
          { status: 400 }
        );
      }
      updateData.height = h;
    }

    if (weight !== undefined) {
      const w = Number(weight);
      if (isNaN(w) || w <= 0) {
        return NextResponse.json(
          { error: "Waga musi być dodatnią liczbą" },
          { status: 400 }
        );
      }
      updateData.weight = w;
    }

    // Walidacja activityLevel
    if (activityLevel !== undefined) {
      if (!VALID_ACTIVITY_LEVELS.has(activityLevel)) {
        return NextResponse.json(
          { error: "Nieprawidłowy poziom aktywności (LOW, MODERATE, HIGH)" },
          { status: 400 }
        );
      }
      updateData.activityLevel = activityLevel;
    }

    // Pozostałe pola
    if (medications !== undefined) updateData.medications = medications;
    if (hasDiabetes !== undefined)
      updateData.hasDiabetes = Boolean(hasDiabetes);
    if (hasPrediabetes !== undefined)
      updateData.hasPrediabetes = Boolean(hasPrediabetes);
    if (hasHypertension !== undefined)
      updateData.hasHypertension = Boolean(hasHypertension);
    if (hasHeartDisease !== undefined)
      updateData.hasHeartDisease = Boolean(hasHeartDisease);
    if (hasKidneyDisease !== undefined)
      updateData.hasKidneyDisease = Boolean(hasKidneyDisease);

    // Obsługa listy chorób (całkowite nadpisanie)
    if (conditions !== undefined) {
      const conditionsArray = Array.isArray(conditions)
        ? conditions
        : conditions
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean);

      updateData.conditions = {
        set: [], // odłączamy wszystkie stare
        connectOrCreate: conditionsArray.map((name) => ({
          where: { name },
          create: { name },
        })),
      };
    }

    // Pobranie aktualnego profilu
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, healthProfile: true },
    });

    if (!user?.healthProfile) {
      return NextResponse.json({ error: "No profile" }, { status: 404 });
    }

    const currentProfile = user.healthProfile;

    // Czy trzeba przeliczyć normy?
    const needRecalculateNorms =
      height !== undefined ||
      weight !== undefined ||
      activityLevel !== undefined ||
      hasDiabetes !== undefined ||
      hasPrediabetes !== undefined ||
      hasHypertension !== undefined ||
      hasHeartDisease !== undefined ||
      hasKidneyDisease !== undefined;

    if (needRecalculateNorms) {
      const age = calculateAge(currentProfile.birthdate);

      const normsResult = getHealthNorms(
        age,
        currentProfile.gender,
        updateData.height ?? currentProfile.height,
        updateData.weight ?? currentProfile.weight,
        updateData.activityLevel ?? currentProfile.activityLevel,
        updateData.hasDiabetes ?? currentProfile.hasDiabetes,
        updateData.hasHypertension ?? currentProfile.hasHypertension,
        updateData.hasHeartDisease ?? currentProfile.hasHeartDisease,
        updateData.hasKidneyDisease ?? currentProfile.hasKidneyDisease,
        updateData.hasPrediabetes ?? currentProfile.hasPrediabetes
      );

      if (normsResult.error) {
        return NextResponse.json({ error: normsResult.error }, { status: 400 });
      }

      updateData.norms = {
        upsert: {
          create: normsResult,
          update: normsResult,
        },
      };
    }

    // Wykonanie aktualizacji
    const updatedProfile = await prisma.healthProfile.update({
      where: { userId: user.id },
      data: updateData,
      include: { norms: true, conditions: true },
    });

    return NextResponse.json(flattenProfileData(updatedProfile));
  } catch (error) {
    console.error("Błąd aktualizacji profilu:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
