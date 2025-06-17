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
      systolicMin: true,
      systolicMax: true,
      diastolicMin: true,
      diastolicMax: true,
      glucoseMin: true,
      glucoseMax: true,
      weightMin: true,
      weightMax: true,
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

  const { age } = await req.json();

  if (!age)
    return NextResponse.json({ error: "Brakuje wieku" }, { status: 400 });

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
    age,
    user.gender as "M" | "K", // 👈 rzutowanie tutaj
    user.height,
    user.weight
  );

  await prisma.user.update({
    where: { email: session.user.email },
    data: {
      age,
      ...norms,
    },
  });

  return NextResponse.json({ success: true });
}
