import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  //  Sprawdzenie sesji
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  //  Pobranie danych z bazy
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      healthProfile: {
        select: {
          birthdate: true,
          gender: true,
          height: true,
          weight: true,
          activityLevel: true,
          healthDataConsent: true,
        },
      },
    },
  });

  //  Wstępna weryfikacja istnienia profilu
  // Jeśli user nie istnieje LUB nie utworzył jeszcze healthProfile, zwracamy false
  if (!user || !user.healthProfile) {
    return NextResponse.json({ complete: false });
  }

  const profile = user.healthProfile;

  //  Logika walidacji

  // Sprawdzenie daty (schema: DateTime -> JS Date object)
  const hasValidBirthdate =
    profile.birthdate instanceof Date && !isNaN(profile.birthdate);

  const hasValidGender =
    profile.gender === "MALE" || profile.gender === "FEMALE";

  const hasValidHeight =
    typeof profile.height === "number" && profile.height > 0;
  const hasValidWeight =
    typeof profile.weight === "number" && profile.weight > 0;

  const validActivityLevels = ["LOW", "MODERATE", "HIGH"];
  const hasValidActivity = validActivityLevels.includes(profile.activityLevel);

  const hasConsent = profile.healthDataConsent === true;

  const complete =
    hasValidBirthdate &&
    hasValidGender &&
    hasValidHeight &&
    hasValidWeight &&
    hasValidActivity &&
    hasConsent;

  return NextResponse.json({ complete });
}
