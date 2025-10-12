import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function DELETE(req) {
  const session = await auth();

  const idParam = req.nextUrl.pathname.split("/").pop(); // np. "10"
  const id = parseInt(idParam || "");

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isNaN(id)) {
    return NextResponse.json(
      { error: "Nieprawidłowe ID pomiaru" },
      { status: 400 }
    );
  }

  try {
    const measurement = await prisma.measurement.findUnique({
      where: { id },
    });

    if (!measurement) {
      return NextResponse.json(
        { error: "Pomiar nie istnieje" },
        { status: 404 }
      );
    }

    if (measurement.userId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    await prisma.measurement.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Pomiar usunięty" }, { status: 200 });
  } catch (error) {
    console.error("❌ Błąd podczas usuwania pomiaru:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
