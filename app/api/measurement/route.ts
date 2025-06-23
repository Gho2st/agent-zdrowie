import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { amount, type, unit, systolic, diastolic, timing, context, note } =
    await req.json();

  if (!type || !unit || (type !== "ciśnienie" && amount === undefined)) {
    return NextResponse.json(
      { error: "Brak wymaganych danych" },
      { status: 400 }
    );
  }

  let finalAmount: string = "";
  let finalSystolic: number | null = null;
  let finalDiastolic: number | null = null;

  if (type === "ciśnienie") {
    if (typeof systolic === "number" && typeof diastolic === "number") {
      finalSystolic = systolic;
      finalDiastolic = diastolic;

      if (isNaN(finalSystolic) || isNaN(finalDiastolic)) {
        return NextResponse.json(
          { error: "Niepoprawne wartości ciśnienia" },
          { status: 400 }
        );
      }

      finalAmount = `${finalSystolic}/${finalDiastolic}`;
    } else {
      return NextResponse.json(
        { error: "Ciśnienie wymaga wartości skurczowej i rozkurczowej" },
        { status: 400 }
      );
    }
  } else {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      return NextResponse.json(
        { error: "Niepoprawna wartość dla cukru lub wagi" },
        { status: 400 }
      );
    }
    finalAmount = parsedAmount.toString();

    // 🔄 Jeśli typ to "waga", zaktualizuj wagę i BMI w tabeli User
    if (type === "waga") {
      const numericWeight = parsedAmount;
      const user = await prisma.user.findUnique({
        where: { id: parseInt(session.user.id) },
        select: { height: true },
      });

      let bmi: number | null = null;

      if (user?.height && user.height > 0) {
        const heightInMeters = user.height / 100;
        bmi = parseFloat((numericWeight / heightInMeters ** 2).toFixed(2));
      }

      await prisma.user.update({
        where: { id: parseInt(session.user.id) },
        data: {
          weight: numericWeight,
          ...(bmi !== null && { bmi }),
        },
      });
    }
  }

  try {
    const measurement = await prisma.measurement.create({
      data: {
        amount: finalAmount,
        type,
        unit,
        userId: parseInt(session.user.id),
        systolic: finalSystolic ?? undefined,
        diastolic: finalDiastolic ?? undefined,
        timing: timing || undefined,
        context: context || undefined,
        note: note || undefined,
      },
    });
    return NextResponse.json(measurement, { status: 200 });
  } catch (error) {
    console.error("Błąd podczas zapisywania pomiaru:", error);
    return NextResponse.json(
      { error: "Błąd podczas zapisywania pomiaru" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const measurements = await prisma.measurement.findMany({
      where: { userId: parseInt(session.user.id) },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(measurements, { status: 200 });
  } catch (error) {
    console.error("Błąd podczas pobierania pomiarów:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania pomiarów" },
      { status: 500 }
    );
  }
}
