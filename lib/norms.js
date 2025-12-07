export function getHealthNorms(
  age,
  gender,
  height,
  weight,
  activityLevel,
  conditions = [] // np. ["cukrzyca", "nadciśnienie"]
) {
  // Walidacja wejścia
  if (age < 18 || age > 120) return { error: "Wiek 18–120 lat" };
  if (height < 50 || height > 250) return { error: "Wzrost 50–250 cm" };
  if (weight < 20 || weight > 300) return { error: "Waga 20–300 kg" };
  if (!["M", "K"].includes(gender)) return { error: "Płeć M lub K" };

  const heightM = height / 100;
  const bmi = weight / (heightM * heightM);
  const hasHighRisk =
    conditions.includes("cukrzyca") || conditions.includes("nadciśnienie");

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
  const glucoseFastingMax = conditions.includes("cukrzyca") ? 130 : 99;
  const glucosePostMealMax = conditions.includes("cukrzyca") ? 180 : 140;

  // Waga docelowa (BMI 18.5–24.9)
  const weightMin = parseFloat((18.5 * heightM ** 2).toFixed(1));
  const weightMax = parseFloat((24.9 * heightM ** 2).toFixed(1));

  // Tętno spoczynkowe
  const pulseMin = activityLevel === "wysoki" ? 40 : 60;
  const pulseMax = 100;

  return {
    systolicMin: 90,
    systolicMax,
    diastolicMin: 60,
    diastolicMax,
    glucoseFastingMin: 70,
    glucoseFastingMax,
    glucosePostMealMax,
    weightMin,
    weightMax,
    bmi: parseFloat(bmi.toFixed(1)),
    pulseMin,
    pulseMax,
  };
}
