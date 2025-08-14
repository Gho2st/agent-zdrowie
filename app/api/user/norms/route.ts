import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { getHealthNorms } from "@/lib/norms";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client"; // ⬅️ NOWE

function calculateAge(birthdate: string | Date): number {
  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

type UpdateUserData = {
  height?: number;
  weight?: number;
  systolicMin?: number;
  systolicMax?: number;
  diastolicMin?: number;
  diastolicMax?: number;
  glucoseFastingMin?: number;
  glucoseFastingMax?: number;
  glucosePostMealMax?: number;
  weightMin?: number;
  weightMax?: number;
  pulseMin?: number;
  pulseMax?: number;
  medications?: string[] | null; // Json? → array lub null
  conditions?: string[] | null; // Json? → array lub null
  bmi?: number;
};

// ⬅️ NOWE: mapuje string[] | null | undefined do typów akceptowanych przez Prisma dla Json?
function toJsonValue(
  value: string[] | null | undefined
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
  if (value === undefined) return undefined; // nie aktualizuj pola
  if (value === null) return Prisma.DbNull; // SQL NULL w kolumnie
  return value as Prisma.JsonArray; // tablica JSON
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      birthdate: true,
      gender: true,
      height: true,
      weight: true,
      medications: true, // Json → array lub null
      conditions: true, // Json → array lub null
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

  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Prisma już zwraca natywne JSON-y — nic nie parse’ujemy
  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: Partial<UpdateUserData> = await req.json();

  const updateData: Partial<UpdateUserData> = {
    height: body.height,
    weight: body.weight,
    systolicMin: body.systolicMin,
    systolicMax: body.systolicMax,
    diastolicMin: body.diastolicMin,
    diastolicMax: body.diastolicMax,
    glucoseFastingMin: body.glucoseFastingMin,
    glucoseFastingMax: body.glucoseFastingMax,
    glucosePostMealMax: body.glucosePostMealMax,
    weightMin: body.weightMin,
    weightMax: body.weightMax,
    pulseMin: body.pulseMin,
    pulseMax: body.pulseMax,
    medications: body.medications ?? undefined, // spodziewamy się array/null/undefined
    conditions: body.conditions ?? undefined,
  };

  const changingWeightOrHeight =
    typeof updateData.weight === "number" ||
    typeof updateData.height === "number";

  if (changingWeightOrHeight) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        gender: true,
        birthdate: true,
        height: true,
        weight: true,
      },
    });

    if (!user || !user.gender || !user.birthdate) {
      return NextResponse.json(
        { error: "Brakuje danych do przeliczenia norm" },
        { status: 400 }
      );
    }

    const newHeight = updateData.height ?? user.height;
    const newWeight = updateData.weight ?? user.weight;

    if (newHeight && newWeight) {
      const age = calculateAge(user.birthdate);
      const norms = getHealthNorms(
        age,
        user.gender as "M" | "K",
        newHeight,
        newWeight
      );

      updateData.bmi = +(newWeight / (newHeight / 100) ** 2).toFixed(1);

      Object.assign(updateData, norms);
    }
  }

  const hasSomethingToUpdate = Object.values(updateData).some(
    (v) => v !== undefined
  );

  if (!hasSomethingToUpdate) {
    return NextResponse.json(
      { error: "Brak danych do aktualizacji" },
      { status: 400 }
    );
  }

  // ZAPIS: używamy helpera toJsonValue — bez stringify/parse
  await prisma.user.update({
    where: { email: session.user.email },
    data: {
      height: updateData.height,
      weight: updateData.weight,
      systolicMin: updateData.systolicMin,
      systolicMax: updateData.systolicMax,
      diastolicMin: updateData.diastolicMin,
      diastolicMax: updateData.diastolicMax,
      glucoseFastingMin: updateData.glucoseFastingMin,
      glucoseFastingMax: updateData.glucoseFastingMax,
      glucosePostMealMax: updateData.glucosePostMealMax,
      weightMin: updateData.weightMin,
      weightMax: updateData.weightMax,
      pulseMin: updateData.pulseMin,
      pulseMax: updateData.pulseMax,
      medications: toJsonValue(updateData.medications), // ⬅️ ważne
      conditions: toJsonValue(updateData.conditions), // ⬅️ ważne
      bmi: updateData.bmi as number | undefined,
    },
  });

  const updated = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      birthdate: true,
      gender: true,
      height: true,
      weight: true,
      bmi: true,
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
      medications: true, // Json → array lub null
      conditions: true, // Json → array lub null
    },
  });

  return NextResponse.json(updated);
}
