export function getHealthNorms(
  age,
  height,
  weight,
  activityLevel,
  hasDiabetes,
  hasHypertension,
  hasHeartDisease,
  hasKidneyDisease,
  hasPrediabetes,
  hasHighBloodPressure,
) {
  console.log(height);
  console.log(weight);
  // Określenie grupy ryzyka
  const hasHighRisk =
    hasDiabetes ||
    hasHypertension ||
    hasHeartDisease ||
    hasKidneyDisease ||
    hasHighBloodPressure ||
    hasPrediabetes;

  // A. Tętno (AHA)
  // dla wysokiej aktywności (sportowcy) dolna granica to 40bpm (bradykardia sportowa)
  const pulseMin = activityLevel === "HIGH" ? 40 : 60;
  const pulseMax = 100;

  // obliczenie tętna treningowego
  const maxHeartRate = 220 - age;
  const targetHeartRateMin = Math.round(maxHeartRate * 0.5);
  const targetHeartRateMax = Math.round(maxHeartRate * 0.85);

  // B. Masa ciała i BMI (WHO)
  const heightM = height / 100;
  const bmi = parseFloat((weight / (heightM * heightM)).toFixed(1));

  const weightMin = parseFloat((18.5 * heightM ** 2).toFixed(1));
  const weightMax = parseFloat((24.9 * heightM ** 2).toFixed(1));

  // C. Ciśnienie krwi (ESC 2024)
  const systolicMin = 90;
  const diastolicMin = 60;

  let optimalSystolicMax = 119;
  let optimalDiastolicMax = 69;

  const elevatedSystolicMax = 139;
  const elevatedDiastolicMax = 89;

  // cel terapeutyczny
  if (hasHighRisk) {
    optimalSystolicMax = 129;
    optimalDiastolicMax = 79;
  }

  // poluzowanie norm dla seniorów w bardzo podeszłym wieku
  if (age >= 85) {
    optimalSystolicMax = 139;
    optimalDiastolicMax = 89;
  }

  // D. Glukoza (ADA 2026) ---
  let glucoseFastingMin = 70;
  let glucoseFastingMax = 99;
  let glucosePostMealMax = 139;

  // cele teraupetyczne dla diabetyków
  if (hasDiabetes) {
    glucoseFastingMin = 80;
    glucoseFastingMax = 130;
    glucosePostMealMax = 179;

    // indywidualizacja dla seniorów i osób z grupy wysokiego ryzyka
    if (age >= 75 || (age >= 65 && hasHighRisk)) {
      glucoseFastingMax = 150;
      glucoseFastingMin = 90;
    }

    if (age >= 85 && hasHighRisk) {
      glucoseFastingMin = 100;
      glucoseFastingMax = 180;
      glucosePostMealMax = 200;
    }
  }

  return {
    systolicMin,
    optimalSystolicMax,
    elevatedSystolicMax,
    diastolicMin,
    optimalDiastolicMax,
    elevatedDiastolicMax,
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
