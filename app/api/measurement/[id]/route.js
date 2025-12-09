import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function DELETE(req, { params }) {
  // 1. Next.js automatycznie wyciąga "id" z nazwy folderu [id]
  const { id } = params;

  const session = await auth();

  // 2. Walidacja sesji
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!id) {
    return NextResponse.json({ error: "Brak ID pomiaru" }, { status: 400 });
  }

  try {
    // 3. Pobranie ID zalogowanego użytkownika (String CUID)
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

    // 4. Pobranie pomiaru w celu weryfikacji właściciela
    const measurement = await prisma.measurement.findUnique({
      where: { id }, // id to String
      select: { userId: true },
    });

    if (!measurement) {
      return NextResponse.json(
        { error: "Pomiar nie istnieje" },
        { status: 404 }
      );
    }

    // 5. Sprawdzenie czy pomiar należy do użytkownika
    if (measurement.userId !== user.id) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    // 6. Usunięcie rekordu
    await prisma.measurement.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Pomiar usunięty" }, { status: 200 });
  } catch (error) {
    console.error("❌ Błąd podczas usuwania pomiaru:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
