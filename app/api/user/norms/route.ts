import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { getHealthNorms } from "@/lib/norms";
import { NextRequest, NextResponse } from "next/server";

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
  medications?: string[];
  conditions?: string[];
  bmi?: number;
};

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
      medications: true,
      conditions: true,
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
    medications: body.medications,
    conditions: body.conditions,
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

  if (Object.keys(updateData).length > 0) {
    const serializedUpdateData = {
      ...updateData,
      medications: updateData.medications
        ? JSON.stringify(updateData.medications)
        : undefined,
      conditions: updateData.conditions
        ? JSON.stringify(updateData.conditions)
        : undefined,
    };

    await prisma.user.update({
      where: { email: session.user.email },
      data: serializedUpdateData,
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
        medications: true,
        conditions: true,
      },
    });

    return NextResponse.json(updated);
  }

  return NextResponse.json(
    { error: "Brak danych do aktualizacji" },
    { status: 400 }
  );
}
