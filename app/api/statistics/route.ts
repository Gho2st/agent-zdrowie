import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Measurement } from "@prisma/client";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt(session.user.id);

  try {
    const measurements = await prisma.measurement.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    // ✅ Typowanie poprawne
    const groupByMonth = (
      data: Measurement[],
      field: keyof Measurement
    ): Record<string, number[]> => {
      const result: Record<string, number[]> = {};
      data.forEach((m) => {
        const value = m[field];
        if (value === undefined || value === null) return;
        const date = new Date(m.createdAt);
        const key = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;
        if (!result[key]) result[key] = [];
        result[key].push(Number(value));
      });
      return result;
    };

    const calculateStats = (grouped: Record<string, number[]>) =>
      Object.entries(grouped).map(([month, values]) => {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        return { month, avg, min, max };
      });

    const waga = calculateStats(
      groupByMonth(
        measurements.filter((m) => m.type === "waga"),
        "amount"
      )
    );

    const cukier = calculateStats(
      groupByMonth(
        measurements.filter((m) => m.type === "cukier"),
        "amount"
      )
    );

    const cisnienieData = measurements.filter((m) => m.type === "ciśnienie");

    const cisnienie = Object.entries(
      groupByMonth(cisnienieData, "systolic")
    ).map(([month, systolicVals]) => {
      const diastolicVals =
        groupByMonth(cisnienieData, "diastolic")[month] || [];
      const avgSystolic =
        systolicVals.reduce((a, b) => a + b, 0) / systolicVals.length;
      const avgDiastolic = diastolicVals.length
        ? diastolicVals.reduce((a, b) => a + b, 0) / diastolicVals.length
        : null;
      const minSystolic = Math.min(...systolicVals);
      const maxSystolic = Math.max(...systolicVals);
      const minDiastolic = diastolicVals.length
        ? Math.min(...diastolicVals)
        : null;
      const maxDiastolic = diastolicVals.length
        ? Math.max(...diastolicVals)
        : null;

      return {
        month,
        avgSystolic,
        avgDiastolic,
        minSystolic,
        maxSystolic,
        minDiastolic,
        maxDiastolic,
      };
    });

    return NextResponse.json({ waga, cukier, cisnienie }, { status: 200 });
  } catch (error) {
    console.error("Błąd podczas generowania statystyk:", error);
    return NextResponse.json({ error: "Błąd statystyk" }, { status: 500 });
  }
}
