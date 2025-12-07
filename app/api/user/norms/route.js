import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { getHealthNorms } from "@/lib/norms";

// Helpers (bez zależności)
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

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Nieautoryzowany dostęp" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        birthdate: true,
        gender: true,
        height: true,
        weight: true,
        activityLevel: true,
        conditions: true,
        medications: true,
        systolicMin: true,
        systolicMax: true,
        diastolicMin: true,
        diastolicMax: true,
        glucoseFastingMin: true,
        glucoseFastingMax: true,
        glucosePrediabetesFastingMin: true,
        glucosePrediabetesFastingMax: true,
        glucosePostMealMax: true,
        weightMin: true,
        weightMax: true,
        pulseMin: true,
        pulseMax: true,
        bmi: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Użytkownik nie znaleziony" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Błąd pobierania danych:", error);
    return NextResponse.json(
      { error: "Wewnętrzny błąd serwera" },
      { status: 500 }
    );
  }
}

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

    // Walidacja leków
    if (medications && medications.length > 500) {
      return NextResponse.json(
        { error: "Lista leków za długa" },
        { status: 400 }
      );
    }

    // Walidacja warunków zdrowotnych
    if (conditions) {
      const conditionsArray = conditions.split(",").filter(Boolean);

      if (conditionsArray.some((c) => !c.trim())) {
        return NextResponse.json(
          { error: "Puste choroby są niedozwolone" },
          { status: 400 }
        );
      }
      if (new Set(conditionsArray).size !== conditionsArray.length) {
        return NextResponse.json(
          { error: "Choroby muszą być unikalne" },
          { status: 400 }
        );
      }
    }

    if (
      activityLevel &&
      !["niski", "umiarkowany", "wysoki"].includes(activityLevel)
    ) {
      return NextResponse.json(
        { error: "Nieprawidłowy poziom aktywności" },
        { status: 400 }
      );
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

    // Pobieranie aktualnych danych użytkownika
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        birthdate: true,
        gender: true,
        height: true,
        weight: true,
        activityLevel: true,
        conditions: true,
      },
    });

    // Obliczenie norm przy zmianie istotnych danych
    let norms = {};
    const changingRelevantData =
      height !== undefined ||
      weight !== undefined ||
      conditions !== undefined ||
      activityLevel !== undefined;

    if (
      changingRelevantData &&
      user?.birthdate &&
      user?.gender &&
      (height !== undefined ? height : user?.height) &&
      (weight !== undefined ? weight : user?.weight)
    ) {
      const age = calculateAge(user.birthdate);
      const newHeight = height ?? user.height;
      const newWeight = weight ?? user.weight;
      const newActivityLevel =
        activityLevel ?? user.activityLevel ?? "umiarkowany";
      const newConditions = conditions
        ? conditions.split(",").filter(Boolean)
        : user.conditions?.split(",") ?? [];

      if (newHeight && newWeight) {
        const normsResult = getHealthNorms(
          age,
          user.gender,
          newHeight,
          newWeight,
          newActivityLevel,
          newConditions
        );

        if (normsResult && "error" in normsResult) {
          return NextResponse.json(
            { error: normsResult.error },
            { status: 400 }
          );
        }
        norms = normsResult;
      }
    }

    // Aktualizacja danych użytkownika
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        medications: medications ?? undefined,
        conditions: conditions ?? undefined,
        activityLevel: activityLevel ?? undefined,
        height: height ?? undefined,
        weight: weight ?? undefined,
        ...norms,
      },
    });

    // Zwrócenie zaktualizowanych danych
    const updated = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        birthdate: true,
        gender: true,
        height: true,
        weight: true,
        activityLevel: true,
        conditions: true,
        medications: true,
        systolicMin: true,
        systolicMax: true,
        diastolicMin: true,
        diastolicMax: true,
        glucoseFastingMin: true,
        glucoseFastingMax: true,
        glucosePrediabetesFastingMin: true,
        glucosePrediabetesFastingMax: true,
        glucosePostMealMax: true,
        weightMin: true,
        weightMax: true,
        pulseMin: true,
        pulseMax: true,
        bmi: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Błąd aktualizacji danych:", error);
    return NextResponse.json(
      { error: "Wewnętrzny błąd serwera" },
      { status: 500 }
    );
  }
}
