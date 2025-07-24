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
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        weightMin: true,
        weightMax: true,
        systolicMin: true,
        systolicMax: true,
        glucoseFastingMin: true,
        glucoseFastingMax: true,
      },
    });

    const last = await prisma.measurement.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const lastWeight = last.find((m) => m.type === "waga")?.amount;
    const lastPressure = last.find((m) => m.type === "ciśnienie");
    const lastGlucose = last.find((m) => m.type === "cukier")?.amount;

    return NextResponse.json({
      user,
      values: {
        weight: lastWeight ? Number(lastWeight.toString()) : null,
        systolic: lastPressure?.systolic ?? null,
        diastolic: lastPressure?.diastolic ?? null,
        glucose: lastGlucose ? Number(lastGlucose.toString()) : null,
      },
    });
  } catch (err) {
    console.error("Błąd pobierania celów:", err);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
