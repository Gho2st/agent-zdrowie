export function getHealthNorms(
  age,
  gender, // Oczekuje: "MALE" lub "FEMALE"
  height,
  weight,
  activityLevel, // Oczekuje: "LOW", "MODERATE", "HIGH"
  conditions = []
) {
  // --- WALIDACJA WEJŚCIA ---
  if (age < 18 || age > 120) return { error: "Wiek musi wynosić 18–120 lat" };
  if (height < 50 || height > 250)
    return { error: "Wzrost musi wynosić 50–250 cm" };
  if (weight < 20 || weight > 300)
    return { error: "Waga musi wynosić 20–300 kg" };

  // ZMIANA: Walidacja pod Enumy (MALE/FEMALE)
  if (!["MALE", "FEMALE"].includes(gender)) {
    return { error: "Nieprawidłowa płeć (wymagane MALE lub FEMALE)" };
  }

  // --- OBLICZENIA ---

  const heightM = height / 100;
  const bmi = weight / (heightM * heightM);

  // Normalizacja nazw chorób do małych liter dla bezpiecznego porównywania
  const normalizedConditions = conditions.map((c) => c.toLowerCase());
  const hasHighRisk =
    normalizedConditions.includes("cukrzyca") ||
    normalizedConditions.includes("nadciśnienie");

  // Ciśnienie – bazowo <120/80 mmHg
  let systolicMax = 119;
  let diastolicMax = 79;

  // Wysokie ryzyko → cel <130/80 mmHg
  if (hasHighRisk) {
    systolicMax = 129;
    diastolicMax = 79;
  }

  // Seniorzy ≥65 lat → złagodzenie do <140/90 mmHg (nadpisuje cel 130)
  if (age >= 65) {
    systolicMax = 139;
    diastolicMax = 89;
  }

  // Glukoza (mg/dL) – ADA 2025
  const glucoseFastingMax = normalizedConditions.includes("cukrzyca")
    ? 130
    : 99;
  const glucosePostMealMax = normalizedConditions.includes("cukrzyca")
    ? 180
    : 140;

  // Waga docelowa (BMI 18.5–24.9)
  const weightMin = parseFloat((18.5 * heightM ** 2).toFixed(1));
  const weightMax = parseFloat((24.9 * heightM ** 2).toFixed(1));

  // Tętno spoczynkowe
  // ZMIANA: Sprawdzanie Enuma "HIGH" zamiast "wysoki"
  const pulseMin = activityLevel === "HIGH" ? 40 : 60;
  const pulseMax = 100;

  // Zwracany obiekt musi pasować kluczami do modelu HealthNorms w schema.prisma
  return {
    systolicMin: 90, // Int
    systolicMax, // Int
    diastolicMin: 60, // Int
    diastolicMax, // Int

    glucoseFastingMin: 70, // Int
    glucoseFastingMax, // Int
    glucosePostMealMax, // Int

    weightMin, // Float
    weightMax, // Float
    bmi: parseFloat(bmi.toFixed(1)), // Float

    pulseMin, // Int
    pulseMax, // Int
  };
}
