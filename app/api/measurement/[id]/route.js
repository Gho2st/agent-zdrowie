import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function DELETE(req, { params }) {
  const { id } = params;

  const session = await auth();

  //  Walidacja sesji
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!id) {
    return NextResponse.json({ error: "Brak ID pomiaru" }, { status: 400 });
  }

  try {
    //  Pobranie ID zalogowanego użytkownika
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Użytkownik nie istnieje" },
        { status: 404 }
      );
    }

    //  Pobranie pomiaru w celu weryfikacji właściciela ORAZ sprawdzenia typu
    const measurementToDelete = await prisma.measurement.findUnique({
      where: { id },
      select: { userId: true, type: true, value: true },
    });

    if (!measurementToDelete) {
      return NextResponse.json(
        { error: "Pomiar nie istnieje" },
        { status: 404 }
      );
    }

    //  Sprawdzenie czy pomiar należy do użytkownika
    if (measurementToDelete.userId !== user.id) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    //  Usunięcie rekordu
    await prisma.measurement.delete({
      where: { id },
    });

    //  LOGIKA AKTUALIZACJI WAGI W HealthProfile
    if (measurementToDelete.type === "WEIGHT") {
      // A. Znajdź najnowszy pozostały pomiar wagi
      const latestRemainingWeight = await prisma.measurement.findMany({
        where: {
          userId: user.id,
          type: "WEIGHT",
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      });

      let newWeightValue = 0; // Ustaw 0 lub inną domyślną wartość, jeśli waga jest wymagana

      if (latestRemainingWeight.length > 0) {
        // B. Jeśli znaleziono, użyj jego wartości
        newWeightValue = latestRemainingWeight[0].value;
      }

      // C. Zaktualizuj HealthProfile użytkownika
      await prisma.healthProfile.update({
        where: { userId: user.id },
        data: { weight: newWeightValue },
      });
    }

    //  Zwrócenie odpowiedzi
    return NextResponse.json({ message: "Pomiar usunięty" }, { status: 200 });
  } catch (error) {
    console.error("❌ Błąd podczas usuwania pomiaru:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
