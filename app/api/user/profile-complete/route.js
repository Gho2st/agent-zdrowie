import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  // 1. Sprawdzenie sesji
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Pobranie danych z bazy
  // ZMIANA: Dane nie są już w 'user', ale w powiązanym 'healthProfile'.
  // Używamy zagnieżdżonego selecta.
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      healthProfile: {
        select: {
          birthdate: true,
          gender: true, // Zwróci string: "MALE" lub "FEMALE"
          height: true,
          weight: true,
          activityLevel: true, // Warto sprawdzić też to, skoro jest w modelu
        },
      },
    },
  });

  // 3. Wstępna weryfikacja istnienia profilu
  // Jeśli user nie istnieje LUB nie utworzył jeszcze healthProfile, zwracamy false
  if (!user || !user.healthProfile) {
    return NextResponse.json({ complete: false });
  }

  const profile = user.healthProfile;

  // 4. Logika walidacji

  // Sprawdzenie daty (schema: DateTime -> JS Date object)
  const hasValidBirthdate =
    profile.birthdate instanceof Date && !isNaN(profile.birthdate);

  // Sprawdzenie płci (schema: enum Gender { MALE, FEMALE })
  // Prisma zwróci tutaj stringa odpowiadającego nazwie Enuma
  const hasValidGender =
    profile.gender === "MALE" || profile.gender === "FEMALE";

  // Sprawdzenie wymiarów
  // schema: height Int, weight Float. Muszą być > 0
  const hasValidHeight =
    typeof profile.height === "number" && profile.height > 0;
  const hasValidWeight =
    typeof profile.weight === "number" && profile.weight > 0;

  // Opcjonalnie: Sprawdzenie poziomu aktywności (skoro jest w modelu HealthProfile)
  const validActivityLevels = ["LOW", "MODERATE", "HIGH"];
  const hasValidActivity = validActivityLevels.includes(profile.activityLevel);

  const complete =
    hasValidBirthdate &&
    hasValidGender &&
    hasValidHeight &&
    hasValidWeight &&
    hasValidActivity;

  return NextResponse.json({ complete });
}
