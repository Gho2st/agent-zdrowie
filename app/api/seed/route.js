import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  // 👇 WPISZ TUTAJ SWÓJ EMAIL
  const USER_EMAIL = "dominik.jojczyk@gmail.com";

  // KONFIGURACJA SEEDA
  const DAYS_BACK = 365; // Generujemy dane z całego roku
  const BATCH_SIZE = 500; // Wielkość paczki do zapisu (dla bezpieczeństwa bazy)

  try {
    // 1. Znajdź użytkownika
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

    // 2. Pętla przez dni (od dzisiaj wstecz)
    for (let i = DAYS_BACK; i >= 0; i--) {
      const baseDate = new Date(today);
      baseDate.setDate(baseDate.getDate() - i); // Ustawiamy dzień

      // --- WAGA (1x dziennie, rano) ---
      // Symulacja: waga waha się, ale spada z 90kg do 80kg przez rok
      const weightTrend = 90 - (10 * (DAYS_BACK - i)) / DAYS_BACK;
      const weightFluctuation = (Math.random() - 0.5) * 1.5; // +/- 0.75kg wahań

      const weightDate = new Date(baseDate);
      weightDate.setHours(7, 30); // Zawsze rano o 7:30

      measurements.push({
        userId: user.id,
        type: "WEIGHT",
        value: parseFloat((weightTrend + weightFluctuation).toFixed(1)),
        unit: "kg",
        createdAt: weightDate,
      });

      // --- PĘTLA DZIENNA (Pomiary wielokrotne: Rano, Południe, Wieczór) ---
      // Generujemy 2 do 3 pomiarów ciśnienia i tętna dziennie
      const dailySamples = 2 + Math.floor(Math.random() * 2); // 2 lub 3 razy dziennie

      for (let j = 0; j < dailySamples; j++) {
        const sampleDate = new Date(baseDate);
        // Rozkładamy godziny: np. 8:00, 14:00, 20:00 z losowym odchyleniem
        const hour = 8 + j * 6 + Math.floor(Math.random() * 2);
        sampleDate.setHours(hour, Math.floor(Math.random() * 60));

        // --- CIŚNIENIE ---
        // Symulacja: Wyższe rano, niższe wieczorem + losowość
        const sysBase = 120 + Math.random() * 10;
        const diaBase = 80 + Math.random() * 5;

        measurements.push({
          userId: user.id,
          type: "BLOOD_PRESSURE",
          value: Math.floor(sysBase + (Math.random() * 10 - 5)),
          value2: Math.floor(diaBase + (Math.random() * 8 - 4)),
          unit: "mmHg",
          createdAt: sampleDate,
        });

        // --- TĘTNO ---
        measurements.push({
          userId: user.id,
          type: "HEART_RATE",
          value: Math.floor(60 + Math.random() * 30), // 60-90 bpm
          unit: "bpm",
          createdAt: sampleDate,
        });
      }

      // --- CUKIER (Codziennie) ---
      const glucoseDate = new Date(baseDate);
      glucoseDate.setHours(8, 15); // Przed śniadaniem
      measurements.push({
        userId: user.id,
        type: "GLUCOSE",
        value: Math.floor(85 + Math.random() * 25), // 85-110
        unit: "mg/dL",
        context: "na czczo",
        createdAt: glucoseDate,
      });
    }

    // 3. Zapisz do bazy w paczkach (Batch Insert)
    // Przy 365 dniach i kilku pomiarach dziennie mamy ok. 2500-3000 rekordów.
    // Dzielimy to na mniejsze kawałki, żeby baza "nie czknęła".

    let totalInserted = 0;

    for (let i = 0; i < measurements.length; i += BATCH_SIZE) {
      const batch = measurements.slice(i, i + BATCH_SIZE);
      await prisma.measurement.createMany({
        data: batch,
      });
      totalInserted += batch.length;
    }

    return NextResponse.json({
      success: true,
      message: `Pomyślnie zseedowano dane.`,
      details: {
        user: user.email,
        daysCovered: DAYS_BACK,
        totalMeasurements: totalInserted,
      },
    });
  } catch (error) {
    console.error("Błąd seedowania:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Nieznany błąd",
      },
      { status: 500 },
    );
  }
}
