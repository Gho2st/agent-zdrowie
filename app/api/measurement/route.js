import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function POST(req) {
  const session = await auth();
  if (!session?.user?.id) {
    console.log("❌ Brak sesji lub ID użytkownika");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  console.log("📥 Otrzymane dane JSON:", body);

  const { amount, type, unit, systolic, diastolic, timing, context, note } =
    body;

  if (!type || !unit || (type !== "ciśnienie" && amount === undefined)) {
    console.warn("⚠️ Brak wymaganych danych:", { type, unit, amount });
    return NextResponse.json(
      { error: "Brak wymaganych danych" },
      { status: 400 }
    );
  }

  let numericAmount = null;
  let finalSystolic = null;
  let finalDiastolic = null;

  if (type === "ciśnienie") {
    if (typeof systolic === "number" && typeof diastolic === "number") {
      finalSystolic = systolic;
      finalDiastolic = diastolic;
      console.log("🩺 Ciśnienie:", { systolic, diastolic });

      if (isNaN(finalSystolic) || isNaN(finalDiastolic)) {
        return NextResponse.json(
          { error: "Niepoprawne wartości ciśnienia" },
          { status: 400 }
        );
      }
    } else {
      console.warn("❌ Brak obu wartości ciśnienia:", { systolic, diastolic });
      return NextResponse.json(
        { error: "Ciśnienie wymaga wartości skurczowej i rozkurczowej" },
        { status: 400 }
      );
    }
  } else {
    console.log("💡 Przetwarzanie amount:", amount, "typ:", typeof amount);

    if (
      amount === "" ||
      amount === null ||
      amount === undefined ||
      (typeof amount === "string" && amount.trim() === "")
    ) {
      return NextResponse.json(
        { error: "Wartość amount nie może być pusta" },
        { status: 400 }
      );
    }

    numericAmount =
      typeof amount === "number"
        ? amount
        : typeof amount === "string"
        ? parseFloat(amount)
        : null;

    console.log("🔢 numericAmount:", numericAmount);

    if (numericAmount === null || isNaN(numericAmount)) {
      return NextResponse.json(
        { error: `Niepoprawna liczba: ${amount}` },
        { status: 400 }
      );
    }

    if (type === "waga") {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(session.user.id) },
        select: { height: true },
      });

      let bmi = null;

      if (user?.height && user.height > 0) {
        const heightInMeters = user.height / 100;
        bmi = parseFloat((numericAmount / heightInMeters ** 2).toFixed(2));
        console.log("⚖️ BMI obliczone:", bmi);
      }

      await prisma.user.update({
        where: { id: parseInt(session.user.id) },
        data: {
          weight: numericAmount,
          ...(bmi !== null && { bmi }),
        },
      });
    }
  }

  try {
    console.log("📤 Tworzenie pomiaru z danymi:", {
      type,
      unit,
      amount: numericAmount,
      userId: parseInt(session.user.id),
      systolic: finalSystolic,
      diastolic: finalDiastolic,
      timing,
      context,
      note,
    });

    const measurement = await prisma.measurement.create({
      data: {
        type,
        unit,
        amount: numericAmount ?? undefined,
        userId: parseInt(session.user.id),
        systolic: finalSystolic ?? undefined,
        diastolic: finalDiastolic ?? undefined,
        timing: timing || undefined,
        context: context || undefined,
        note: note || undefined,
      },
    });

    console.log("✅ Pomiar zapisany:", measurement);
    return NextResponse.json(measurement, { status: 200 });
  } catch (error) {
    console.error("❌ Błąd podczas zapisywania pomiaru:", error);
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
      where: {
        userId: parseInt(session.user.id),
      },
      orderBy: {
        createdAt: "desc",
      },
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
