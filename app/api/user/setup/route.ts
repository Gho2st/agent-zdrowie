import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// 🧠 Oblicz normy zdrowotne wg WHO/ESH/AHA
function getHealthNorms(
  age: number,
  gender: "M" | "K",
  height: number,
  weight: number
) {
  const heightMeters = height / 100;
  const bmi = weight / (heightMeters * heightMeters);

  let systolicMin = 110;
  let systolicMax = 120;
  let diastolicMin = 70;
  let diastolicMax = 80;

  if (age >= 40 && age < 60) {
    systolicMax = 130;
    diastolicMax = 85;
  } else if (age >= 60) {
    systolicMax = 140;
    diastolicMax = 90;
  }

  const glucoseMin = 70;
  const glucoseMax = 99;

  const bmiMin = 18.5;
  const bmiMax = 24.9;
  const weightMin = parseFloat((bmiMin * heightMeters ** 2).toFixed(1));
  const weightMax = parseFloat((bmiMax * heightMeters ** 2).toFixed(1));

  return {
    systolicMin,
    systolicMax,
    diastolicMin,
    diastolicMax,
    glucoseMin,
    glucoseMax,
    weightMin,
    weightMax,
  };
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { age, gender, height, weight } = await req.json();

  const norms = getHealthNorms(age, gender, height, weight);

  await prisma.user.update({
    where: { email: session.user.email },
    data: {
      age,
      gender,
      height,
      weight,
      ...norms,
    },
  });

  return NextResponse.json({ success: true });
}
