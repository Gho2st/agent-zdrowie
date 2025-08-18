/**
 * Oblicza indywidualne normy zdrowotne na podstawie wieku, płci, wzrostu, masy ciała, poziomu aktywności i stanu zdrowia.
 * Normy oparte na AHA (2022), WHO (2023), ADA (2024).
 * @param age Wiek użytkownika (lata)
 * @param gender Płeć użytkownika ("M" - mężczyzna, "K" - kobieta)
 * @param height Wzrost użytkownika (cm)
 * @param weight Masa ciała użytkownika (kg)
 * @param activityLevel Poziom aktywności fizycznej ("niski", "umiarkowany", "wysoki")
 * @param conditions Choroby przewlekłe (np. "cukrzyca", "nadciśnienie") lub "ciąża"
 * @returns Obiekt z normami lub błąd
 */
export function getHealthNorms(
  age: number,
  gender: "M" | "K",
  height: number,
  weight: number,
  activityLevel: "niski" | "umiarkowany" | "wysoki" = "umiarkowany",
  conditions: string[] = []
): { [key: string]: number } | { error: string } {
  // Walidacja danych wejściowych
  if (age < 0 || age > 120)
    return { error: "Wiek musi być między 0 a 120 lat" };
  if (height < 50 || height > 250)
    return { error: "Wzrost musi być między 50 a 250 cm" };
  if (weight < 20 || weight > 300)
    return { error: "Masa ciała musi być między 20 a 300 kg" };
  if (!["M", "K"].includes(gender))
    return { error: "Płeć musi być 'M' lub 'K'" };

  // Obliczenie BMI (WHO, 2023)
  const heightMeters = height / 100;
  const bmi = weight / (heightMeters * heightMeters);

  // Normy ciśnienia krwi (AHA, 2022)
  const systolicMin = gender === "K" ? 90 : 100;
  let systolicMax = gender === "K" ? 119 : 129; // Normalne: <120/80 mmHg
  const diastolicMin = gender === "K" ? 60 : 65;
  let diastolicMax = gender === "K" ? 79 : 79;

  // Korekty dla wieku i chorób (WHO, 2023; AHA, 2022)
  if (age >= 60) {
    systolicMax = 150; // Akceptowalne dla seniorów
    diastolicMax = 90;
  } else if (age >= 40) {
    systolicMax += 5;
    diastolicMax += 5;
  }
  if (conditions.includes("nadciśnienie")) {
    systolicMax += 10; // Wyższe normy dla osób z nadciśnieniem
    diastolicMax += 10;
  }
  if (conditions.includes("ciąża") && gender === "K") {
    systolicMax = 130; // Specjalne normy dla ciąży (ACOG, 2023)
    diastolicMax = 85;
  }

  // Normy glukozy (ADA, 2024)
  const glucoseFastingMin = 70;
  const glucoseFastingMax = conditions.includes("cukrzyca") ? 130 : 99; // Wyższe dla cukrzyków
  const glucosePrediabetesFastingMin = 100;
  const glucosePrediabetesFastingMax = 125;
  const glucosePostMealMax = conditions.includes("cukrzyca") ? 180 : 140;

  // Normy BMI (WHO, 2023)
  const bmiMin = 18.5;
  const bmiMax = conditions.includes("ciąża") ? 28 : 24.9; // Wyższe dla ciąży
  const weightMin = parseFloat((bmiMin * heightMeters ** 2).toFixed(1));
  const weightMax = parseFloat((bmiMax * heightMeters ** 2).toFixed(1));

  // Tętno spoczynkowe (AHA, 2022)
  const pulseMin = activityLevel === "wysoki" ? 40 : 60;
  const pulseMax = 100;

  return {
    systolicMin,
    systolicMax,
    diastolicMin,
    diastolicMax,
    glucoseFastingMin,
    glucoseFastingMax,
    glucosePrediabetesFastingMin,
    glucosePrediabetesFastingMax,
    glucosePostMealMax,
    weightMin,
    weightMax,
    bmi: parseFloat(bmi.toFixed(1)),
    pulseMin,
    pulseMax,
  };
}
