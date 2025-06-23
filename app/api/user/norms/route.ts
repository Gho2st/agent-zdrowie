import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { getHealthNorms } from "@/lib/norms";
import { NextRequest, NextResponse } from "next/server";

// ✅ GET: pobierz dane użytkownika + normy
export async function GET() {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      age: true,
      gender: true,
      height: true,
      weight: true,
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
      bmi: true,
    },
  });

  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json(user);
}

// ✅ PATCH: zaktualizuj wiek i przelicz normy na podstawie danych z bazy
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const allowedFields = [
    "age",
    "systolicMin",
    "systolicMax",
    "diastolicMin",
    "diastolicMax",
    "glucoseFastingMin",
    "glucoseFastingMax",
    "glucosePostMealMax",
    "weightMin",
    "weightMax",
    "medications"
  ];

  const updateData: Record<string, number> = {};
  for (const key of allowedFields) {
    if (key in body) {
      updateData[key] = body[key];
    }
  }

  // 🔹 Jeśli przysłano tylko wiek → przelicz automatycznie normy
  if (Object.keys(updateData).length === 1 && "age" in updateData) {
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

    const norms = getHealthNorms(
      updateData.age,
      user.gender as "M" | "K",
      user.height,
      user.weight
    );

    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        age: updateData.age,
        ...norms,
      },
    });

    return NextResponse.json({ success: true });
  }

  // 🔹 reczna aktualizacja danych (np normy, leki)
  if (Object.keys(updateData).length > 0) {
    await prisma.user.update({
      where: { email: session.user.email },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json(
    { error: "Brak danych do aktualizacji" },
    { status: 400 }
  );
}
