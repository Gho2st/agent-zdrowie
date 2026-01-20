import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Pobieramy tylko surowe dane, bez analizy
    const measurements = await prisma.measurement.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        type: true,
        value: true,
        value2: true,
        unit: true,
        createdAt: true,
        context: true, // Ważne dla analizy (np. czy na czczo)
        note: true,
      },
    });

    return NextResponse.json(measurements);
  } catch (error) {
    console.error("Błąd pobierania ostatnich pomiarów:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
