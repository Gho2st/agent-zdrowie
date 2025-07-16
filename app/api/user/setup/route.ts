import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getHealthNorms } from "@/lib/norms";

function calculateAge(birthdate: string): number {
  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { birthdate, gender, height, weight } = await req.json();

  const age = calculateAge(birthdate); // używamy do obliczenia norm

  const norms = getHealthNorms(age, gender, height, weight);

  await prisma.user.update({
    where: { email: session.user.email },
    data: {
      birthdate: new Date(birthdate),
      gender,
      height,
      weight,
      ...norms,
    },
  });

  return NextResponse.json({ success: true });
}
