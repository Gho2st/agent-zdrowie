import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checkin = await prisma.dailyCheckin.findUnique({
    where: {
      userId_date: {
        userId: Number(session.user.id),
        date: today,
      },
    },
  });

  return NextResponse.json(checkin, { status: 200 });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { mood, sleep, energy, stress } = body;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const saved = await prisma.dailyCheckin.upsert({
      where: {
        userId_date: {
          userId: Number(session.user.id),
          date: today,
        },
      },
      update: {
        mood,
        sleep,
        energy,
        stress,
      },
      create: {
        userId: Number(session.user.id),
        date: today,
        mood,
        sleep,
        energy,
        stress,
      },
    });

    return NextResponse.json(saved, { status: 200 });
  } catch (err) {
    console.error("❌ Błąd przy zapisie DailyCheckin:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
