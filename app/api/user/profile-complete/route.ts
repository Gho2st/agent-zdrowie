import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      birthdate: true,
      gender: true,
      height: true,
      weight: true,
    },
  });

  const complete =
    !!user &&
    user.birthdate instanceof Date &&
    (user.gender === "M" || user.gender === "K") &&
    typeof user.height === "number" &&
    user.height > 0 &&
    typeof user.weight === "number" &&
    user.weight > 0;

  return NextResponse.json({ complete });
}
