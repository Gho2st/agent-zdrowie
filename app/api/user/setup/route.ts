import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getHealthNorms } from "@/lib/norms";

function calculateAge(birthdate: string): number {
  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Nieautoryzowany dostęp" },
        { status: 401 }
      );
    }

    const {
      birthdate,
      gender,
      height,
      weight,
      activityLevel,
      conditions,
      pregnancy,
    } = await req.json();

    // Walidacja danych wejściowych
    if (!birthdate || isNaN(new Date(birthdate).getTime())) {
      return NextResponse.json(
        { error: "Nieprawidłowa data urodzenia" },
        { status: 400 }
      );
    }
    if (!["M", "K"].includes(gender)) {
      return NextResponse.json(
        { error: "Nieprawidłowa płeć" },
        { status: 400 }
      );
    }
    if (height < 50 || height > 250) {
      return NextResponse.json(
        { error: "Wzrost musi być między 50 a 250 cm" },
        { status: 400 }
      );
    }
    if (weight < 20 || weight > 300) {
      return NextResponse.json(
        { error: "Waga musi być między 20 a 300 kg" },
        { status: 400 }
      );
    }
    if (!["niski", "umiarkowany", "wysoki"].includes(activityLevel)) {
      return NextResponse.json(
        { error: "Nieprawidłowy poziom aktywności" },
        { status: 400 }
      );
    }
    const conditionsArray = conditions
      ? conditions.split(",").filter(Boolean)
      : [];
    if (gender === "M" && pregnancy) {
      return NextResponse.json(
        { error: "Ciąża możliwa tylko dla kobiet" },
        { status: 400 }
      );
    }
    const age = calculateAge(birthdate);
    if (pregnancy && (age < 15 || age > 50)) {
      return NextResponse.json(
        { error: "Ciąża możliwa tylko dla kobiet w wieku 15-50 lat" },
        { status: 400 }
      );
    }
    if (conditionsArray.some((c: string) => !c.trim())) {
      return NextResponse.json(
        { error: "Puste choroby są niedozwolone" },
        { status: 400 }
      );
    }
    if (new Set(conditionsArray).size !== conditionsArray.length) {
      return NextResponse.json(
        { error: "Choroby muszą być unikalne" },
        { status: 400 }
      );
    }

    // Obliczenie norm
    const norms = getHealthNorms(
      age,
      gender,
      height,
      weight,
      activityLevel,
      conditionsArray,
      pregnancy // Przekazanie ciąży jako osobnego parametru
    );
    if ("error" in norms) {
      return NextResponse.json({ error: norms.error }, { status: 400 });
    }

    // Aktualizacja danych użytkownika w bazie
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        birthdate: new Date(birthdate),
        gender,
        height,
        weight,
        activityLevel,
        conditions: conditionsArray.join(","),
        pregnancy, // Nowe pole
        ...norms,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Błąd aktualizacji profilu:", error);
    return NextResponse.json(
      { error: "Wewnętrzny błąd serwera" },
      { status: 500 }
    );
  }
}
