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
  birthdate?: string | Date;
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

  // Jawna i bezpieczna budowa obiektu aktualizacji
  const updateData: Partial<UpdateUserData> = {
    birthdate: body.birthdate,
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
    medications: body.medications,
    conditions: body.conditions,
  };

  // Obsługa tylko aktualizacji daty urodzenia i przeliczenia norm
  if (Object.keys(updateData).length === 1 && updateData.birthdate) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        gender: true,
        height: true,
        weight: true,
      },
    });

    if (!user || !user.gender || !user.height || !user.weight) {
      return NextResponse.json(
        { error: "Brakuje danych do przeliczenia norm" },
        { status: 400 }
      );
    }

    const age = calculateAge(updateData.birthdate);

    const norms = getHealthNorms(
      age,
      user.gender as "M" | "K",
      user.height,
      user.weight
    );

    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        birthdate: new Date(updateData.birthdate),
        ...norms,
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
        medications: true,
        conditions: true,
      },
    });

    return NextResponse.json(updated);
  }

  // Przeliczanie BMI jeśli zmieniono wagę lub wzrost
  if ("height" in updateData || "weight" in updateData) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        height: true,
        weight: true,
      },
    });

    const newHeight = updateData.height ?? user?.height;
    const newWeight = updateData.weight ?? user?.weight;

    if (newHeight && newWeight) {
      updateData.bmi = +(newWeight / (newHeight / 100) ** 2).toFixed(1);
    }
  }

  if (Object.keys(updateData).length > 0) {
    // Konwersja birthdate do Date
    if (updateData.birthdate) {
      updateData.birthdate = new Date(updateData.birthdate);
    }

    // Jeśli medications/conditions są tablicami, zamień na JSON.stringified
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
