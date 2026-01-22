import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const USER_EMAIL = "biosite.praca@gmail.com";

  // ────────────────────────────────────────
  //    KONFIGURACJA – mały seed (~10%)
  // ────────────────────────────────────────
  const DAYS_BACK = 37; // ~10% z 365 dni
  const BATCH_SIZE = 200;

  try {
    const user = await prisma.user.findUnique({
      where: { email: USER_EMAIL },
    });

    if (!user) {
      return NextResponse.json(
        { error: `Nie znaleziono użytkownika: ${USER_EMAIL}` },
        { status: 404 },
      );
    }

    const measurements = [];
    const today = new Date();

    for (let i = DAYS_BACK; i >= 0; i--) {
      const baseDate = new Date(today);
      baseDate.setDate(baseDate.getDate() - i);

      // ─── WAGA (1× dziennie) ───────────────────────────────
      const weightTrend = 90 - (10 * (DAYS_BACK - i)) / DAYS_BACK;
      const weightFluctuation = (Math.random() - 0.5) * 1.2;

      const weightDate = new Date(baseDate);
      weightDate.setHours(7, 30);

      measurements.push({
        userId: user.id,
        type: "WEIGHT",
        value: parseFloat((weightTrend + weightFluctuation).toFixed(1)),
        unit: "kg",
        createdAt: weightDate,
      });

      // ─── Jeden pomiar ciśnienia + tętna dziennie ──────────
      const sampleDate = new Date(baseDate);
      sampleDate.setHours(
        8 + Math.floor(Math.random() * 8),
        Math.floor(Math.random() * 60),
      ); // 8–16

      // Ciśnienie
      const sys = Math.floor(118 + Math.random() * 14); // ~118–132
      const dia = Math.floor(78 + Math.random() * 10); // ~78–88

      measurements.push({
        userId: user.id,
        type: "BLOOD_PRESSURE",
        value: sys,
        value2: dia,
        unit: "mmHg",
        createdAt: sampleDate,
      });

      // Tętno
      measurements.push({
        userId: user.id,
        type: "HEART_RATE",
        value: Math.floor(62 + Math.random() * 24), // 62–86
        unit: "bpm",
        createdAt: sampleDate,
      });

      // ─── Cukier (1× dziennie) ─────────────────────────────
      const glucoseDate = new Date(baseDate);
      glucoseDate.setHours(8, 15);

      measurements.push({
        userId: user.id,
        type: "GLUCOSE",
        value: Math.floor(84 + Math.random() * 22), // ~84–106
        unit: "mg/dL",
        context: "na czczo",
        createdAt: glucoseDate,
      });
    }

    // ─── Zapis paczkami ────────────────────────────────────
    let totalInserted = 0;

    for (let i = 0; i < measurements.length; i += BATCH_SIZE) {
      const batch = measurements.slice(i, i + BATCH_SIZE);
      await prisma.measurement.createMany({ data: batch });
      totalInserted += batch.length;
    }

    return NextResponse.json({
      success: true,
      message: `Pomyślnie zseedowano mały zestaw danych (~10%)`,
      details: {
        user: user.email,
        daysCovered: DAYS_BACK + 1,
        totalMeasurements: totalInserted,
      },
    });
  } catch (error) {
    console.error("Błąd seedowania:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nieznany błąd" },
      { status: 500 },
    );
  }
}
