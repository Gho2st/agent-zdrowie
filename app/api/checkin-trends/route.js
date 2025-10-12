import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(req) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") || "7");

  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - (days - 1));
  fromDate.setHours(0, 0, 0, 0);

  const checkins = await prisma.dailyCheckin.findMany({
    where: {
      userId: Number(session.user.id),
      date: {
        gte: fromDate,
      },
    },
    orderBy: {
      date: "asc",
    },
    select: {
      date: true,
      sleep: true,
      stress: true,
      energy: true,
    },
  });

  const formatted = checkins.map((entry) => ({
    date: entry.date.toISOString(),
    sleep: entry.sleep,
    stress: entry.stress,
    energy: entry.energy,
  }));

  return NextResponse.json(formatted);
}
