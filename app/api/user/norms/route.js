import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { getHealthNorms } from "@/lib/norms";

function calculateAge(birthdate) {
  if (!birthdate) return 30;
  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function calculateBMI(heightCm, weightKg) {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return null;
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
}

const VALID_ACTIVITY_LEVELS = new Set(["LOW", "MODERATE", "HIGH"]);

function flattenProfileData(healthProfile) {
  if (!healthProfile) return null;

  const { norms, conditions, ...rest } = healthProfile;

  const conditionsString = conditions
    ? conditions.map((c) => c.name).join(", ")
    : "";

  const hasHighRisk =
    rest.hasDiabetes ||
    rest.hasPrediabetes ||
    rest.hasHypertension ||
    rest.hasHighBloodPressure ||
    rest.hasHeartDisease ||
    rest.hasKidneyDisease;

  return {
    ...rest,
    activityLevel: rest.activityLevel,
    conditions: conditionsString,
    ...norms,
    hasHighRisk,
  };
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { healthProfile: { include: { norms: true, conditions: true } } },
    });

    if (!user || !user.healthProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(flattenProfileData(user.healthProfile));
  } catch (error) {
    console.error("Błąd GET /api/user/norms:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { reset, medications, conditions, activityLevel, height, weight } =
      body;

    const updateData = {};
    const heightChanged = height !== undefined;
    const weightChanged = weight !== undefined;

    if (heightChanged) updateData.height = Number(height);
    if (weightChanged) updateData.weight = Number(weight);
    if (activityLevel && VALID_ACTIVITY_LEVELS.has(activityLevel)) {
      updateData.activityLevel = activityLevel;
    }
    if (medications !== undefined) {
      updateData.medications = (medications || "").trim();
    }

    const booleanFields = [
      "hasDiabetes",
      "hasPrediabetes",
      "hasHighBloodPressure",
      "hasHypertension",
      "hasHeartDisease",
      "hasKidneyDisease",
    ];

    booleanFields.forEach((field) => {
      if (body[field] !== undefined) {
        updateData[field] = !!body[field];
      }
    });

    const MANUAL_NORM_FIELDS = [
      "systolicMin",
      "systolicMax",
      "diastolicMin",
      "diastolicMax",
      "glucoseFastingMin",
      "glucoseFastingMax",
      "glucosePostMealMax",
      "weightMin",
      "weightMax",
      "pulseMin",
      "pulseMax",
      "maxHeartRate",
      "targetHeartRateMin",
      "targetHeartRateMax",
    ];

    let hasManualNorms = false;
    const manualNorms = {};

    MANUAL_NORM_FIELDS.forEach((field) => {
      if (field in body) {
        hasManualNorms = true;
        const val = body[field];
        manualNorms[field] = val === "" || val == null ? null : Number(val);
      }
    });

    const diseaseChanged = booleanFields.some(
      (field) => body[field] !== undefined,
    );
    const activityChanged = activityLevel !== undefined;

    const shouldRecalcDefault =
      heightChanged ||
      weightChanged ||
      reset ||
      diseaseChanged ||
      activityChanged;

    let normsUpdate = null;

    if (shouldRecalcDefault || hasManualNorms) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { healthProfile: { include: { norms: true } } },
      });

      if (!user?.healthProfile) {
        return NextResponse.json({ error: "Brak profilu" }, { status: 404 });
      }

      const profile = user.healthProfile;
      const currentNorms = profile.norms || {};

      const cleanCurrentNorms = { ...currentNorms };

      let finalNorms;

      if (reset || (shouldRecalcDefault && !hasManualNorms)) {
        const calculationData = {
          age: calculateAge(profile.birthdate),
          gender: profile.gender,
          height: updateData.height ?? profile.height ?? 0,
          weight: updateData.weight ?? profile.weight ?? 0,
          activityLevel:
            updateData.activityLevel ?? profile.activityLevel ?? "MODERATE",
          hasDiabetes: updateData.hasDiabetes ?? profile.hasDiabetes ?? false,
          hasPrediabetes:
            updateData.hasPrediabetes ?? profile.hasPrediabetes ?? false,
          hasHighBloodPressure:
            updateData.hasHighBloodPressure ??
            profile.hasHighBloodPressure ??
            false,
          hasHypertension:
            updateData.hasHypertension ?? profile.hasHypertension ?? false,
          hasHeartDisease:
            updateData.hasHeartDisease ?? profile.hasHeartDisease ?? false,
          hasKidneyDisease:
            updateData.hasKidneyDisease ?? profile.hasKidneyDisease ?? false,
        };

        finalNorms = getHealthNorms(
          calculationData.age,
          calculationData.height,
          calculationData.weight,
          calculationData.activityLevel,
          calculationData.hasDiabetes,
          calculationData.hasHypertension,
          calculationData.hasHeartDisease,
          calculationData.hasKidneyDisease,
          calculationData.hasPrediabetes,
          calculationData.hasHighBloodPressure,
        );
      } else if (hasManualNorms) {
        const bmi = calculateBMI(
          updateData.height ?? profile.height,
          updateData.weight ?? profile.weight,
        );
        finalNorms = { ...cleanCurrentNorms, ...manualNorms, bmi };
      } else {
        const bmi = calculateBMI(
          updateData.height ?? profile.height,
          updateData.weight ?? profile.weight,
        );
        finalNorms = { ...cleanCurrentNorms, bmi };
      }

      normsUpdate = {
        upsert: {
          create: finalNorms,
          update: finalNorms,
        },
      };
    }

    const userForId = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    const updatedProfile = await prisma.healthProfile.update({
      where: { userId: userForId.id },
      data: {
        ...updateData,
        ...(normsUpdate && { norms: normsUpdate }),
        ...(conditions !== undefined && {
          conditions: {
            set: [],
            connectOrCreate: (Array.isArray(conditions)
              ? conditions
              : typeof conditions === "string"
                ? conditions
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                : []
            ).map((name) => ({
              where: { name },
              create: { name },
            })),
          },
        }),
      },
      include: { norms: true, conditions: true },
    });

    return NextResponse.json(flattenProfileData(updatedProfile));
  } catch (error) {
    console.error("Błąd PATCH /api/user/norms:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
