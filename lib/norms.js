export function getHealthNorms(
  age,
  gender,
  height,
  weight,
  activityLevel, // Oczekuje: "LOW", "MODERATE", "HIGH"
  hasDiabetes,
  hasHypertension,
  hasHeartDisease,
  hasKidneyDisease,
  hasPrediabetes
) {
  const hasHighRisk =
    hasDiabetes ||
    hasHypertension ||
    hasHeartDisease ||
    hasKidneyDisease ||
    hasPrediabetes;

  // A. Tętno (AHA)
  const pulseMin = activityLevel === "HIGH" ? 40 : 60;
  const pulseMax = 100;

  const maxHeartRate = 220 - age;
  const targetHeartRateMin = Math.round(maxHeartRate * 0.5);
  const targetHeartRateMax = Math.round(maxHeartRate * 0.85);

  // B. Masa ciała i BMI (WHO)
  const heightM = height / 100;
  const bmi = parseFloat((weight / (heightM * heightM)).toFixed(1));

  const weightMin = parseFloat((18.5 * heightM ** 2).toFixed(1));
  const weightMax = parseFloat((24.9 * heightM ** 2).toFixed(1));

  // C. Ciśnienie krwi (ESC 2024)
  let systolicMax = 119;
  let diastolicMax = 69;

  if (hasHighRisk) {
    systolicMax = 129;
    diastolicMax = 79;
  }

  if (age >= 85) {
    systolicMax = 139;
  }

  // D. Glukoza (ADA 2026) ---
  let glucoseFastingMin = 70;
  let glucoseFastingMax = 99;
  let glucosePostMealMax = 139;

  if (hasDiabetes) {
    glucoseFastingMin = 80;
    glucoseFastingMax = 129;
    glucosePostMealMax = 179;

    if (age >= 85 || (age >= 65 && hasHighRisk)) {
      glucoseFastingMax = 150;
    }
  }

  return {
    systolicMin: 90,
    systolicMax,
    diastolicMin: 60,
    diastolicMax,
    glucoseFastingMin,
    glucoseFastingMax,
    glucosePostMealMax,
    weightMin,
    weightMax,
    bmi,
    pulseMin,
    pulseMax,
    maxHeartRate,
    targetHeartRateMin,
    targetHeartRateMax,
  };
}
