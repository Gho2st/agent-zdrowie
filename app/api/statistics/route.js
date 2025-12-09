import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

// Obsługa żądania GET dla statystyk
export async function GET() {
  const session = await auth();

  // 1. Walidacja sesji po emailu
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Pobranie ID użytkownika (String/CUID) na podstawie emaila
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = user.id; // To jest String

    // 3. Pobranie pomiarów
    const measurements = await prisma.measurement.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: {
        type: true,
        value: true, // Główne pole (np. waga, cukier, ciśnienie skurczowe)
        value2: true, // Drugie pole (np. ciśnienie rozkurczowe)
        createdAt: true,
      },
    });

    // --- FUNKCJE POMOCNICZE ---

    // Grupowanie danych według miesiąca
    const groupByMonth = (data, field) => {
      const result = {};
      data.forEach((m) => {
        const val = m[field];
        // Sprawdzenie czy wartość istnieje (pamiętaj, że value2 może być null)
        if (val === undefined || val === null) return;

        let numericValue;
        try {
          numericValue = Number(val.toString());
        } catch {
          return;
        }

        const date = new Date(m.createdAt);
        const key = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

        if (!result[key]) result[key] = [];
        result[key].push(numericValue);
      });
      return result;
    };

    // Obliczanie statystyk (średnia, min, max)
    const calculateStats = (grouped) =>
      Object.entries(grouped).map(([month, values]) => {
        if (!values || values.length === 0)
          return { month, avg: 0, min: 0, max: 0 };

        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        // Zaokrąglamy średnią do 1 miejsca po przecinku
        return { month, avg: parseFloat(avg.toFixed(1)), min, max };
      });

    // --- PRZETWARZANIE DANYCH ---

    // 1. Waga (WEIGHT) -> pole 'value'
    const waga = calculateStats(
      groupByMonth(
        measurements.filter((m) => m.type === "WEIGHT"),
        "value"
      )
    );

    // 2. Cukier (GLUCOSE) -> pole 'value'
    const cukier = calculateStats(
      groupByMonth(
        measurements.filter((m) => m.type === "GLUCOSE"),
        "value"
      )
    );

    // 3. Tętno (HEART_RATE) -> pole 'value'
    const tetno = calculateStats(
      groupByMonth(
        measurements.filter((m) => m.type === "HEART_RATE"),
        "value"
      )
    );

    // 4. Ciśnienie (BLOOD_PRESSURE) -> 'value' (skurczowe) i 'value2' (rozkurczowe)
    const cisnienieData = measurements.filter(
      (m) => m.type === "BLOOD_PRESSURE"
    );

    // Grupujemy osobno skurczowe i rozkurczowe
    const systolicGrouped = groupByMonth(cisnienieData, "value"); // value = skurczowe
    const diastolicGrouped = groupByMonth(cisnienieData, "value2"); // value2 = rozkurczowe

    // Scalamy wyniki iterując po miesiącach ze skurczowego (zazwyczaj są te same)
    const cisnienie = Object.entries(systolicGrouped).map(
      ([month, systolicVals]) => {
        const diastolicVals = diastolicGrouped[month] || [];

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
          avgSystolic: parseFloat(avgSystolic.toFixed(0)), // Ciśnienie zazwyczaj bez przecinków
          avgDiastolic: avgDiastolic
            ? parseFloat(avgDiastolic.toFixed(0))
            : null,
          minSystolic,
          maxSystolic,
          minDiastolic,
          maxDiastolic,
        };
      }
    );

    return NextResponse.json(
      { waga, cukier, tetno, cisnienie },
      { status: 200 }
    );
  } catch (error) {
    console.error("Błąd podczas generowania statystyk:", error);
    return NextResponse.json({ error: "Błąd statystyk" }, { status: 500 });
  }
}
