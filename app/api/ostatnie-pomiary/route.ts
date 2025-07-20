import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt(session.user.id);

  try {
    const measurements = await prisma.measurement.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json(measurements, { status: 200 });
  } catch (error) {
    console.error("Błąd pobierania pomiarów:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
