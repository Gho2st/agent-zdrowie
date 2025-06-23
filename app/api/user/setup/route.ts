import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getHealthNorms } from "@/lib/norms";

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
