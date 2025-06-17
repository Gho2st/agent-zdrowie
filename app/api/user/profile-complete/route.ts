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
      age: true,
      gender: true,
      height: true,
      weight: true,
    },
  });

  const complete =
    !!user?.age && !!user?.gender && !!user?.height && !!user?.weight;

  return NextResponse.json({ complete });
}
