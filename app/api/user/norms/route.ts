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

// ✅ GET: pobierz dane użytkownika + normy
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

// ✅ PATCH: zaktualizuj dane lub przelicz normy
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const allowedFields = [
    "birthdate",
    "height",
    "weight",
    "systolicMin",
    "systolicMax",
    "diastolicMin",
    "diastolicMax",
    "glucoseFastingMin",
    "glucoseFastingMax",
    "glucosePostMealMax",
    "weightMin",
    "weightMax",
    "medications",
    "conditions",
  ];

  const updateData: Record<string, any> = {};
  for (const key of allowedFields) {
    if (key in body) {
      updateData[key] = body[key];
    }
  }

  // 🔹 Jeśli birthdate – przelicz normy
  if (Object.keys(updateData).length === 1 && "birthdate" in updateData) {
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

  // 🔹 Jeśli height lub weight – przelicz BMI
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

  // 🔹 Ręczna aktualizacja różnych danych
  if (Object.keys(updateData).length > 0) {
    if (updateData.birthdate) {
      updateData.birthdate = new Date(updateData.birthdate);
    }

    await prisma.user.update({
      where: { email: session.user.email },
      data: updateData,
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
