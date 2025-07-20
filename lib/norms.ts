export function getHealthNorms(
  age: number,
  gender: "M" | "K",
  height: number,
  weight: number
) {
  const heightMeters = height / 100;
  const bmi = weight / (heightMeters * heightMeters);

  // Domyślne zakresy ciśnienia krwi
  const systolicMin = gender === "K" ? 90 : 100;
  let systolicMax = gender === "K" ? 120 : 129;

  const diastolicMin = gender === "K" ? 60 : 65;
  let diastolicMax = gender === "K" ? 80 : 84;

  // Starsze osoby mają często wyższe ciśnienie akceptowalne
  if (age >= 60) {
    systolicMax += 5;
    diastolicMax += 5;
  }

  // Glukoza (na czczo i po posiłku)
  const glucoseFastingMin = 70;
  const glucoseFastingMax = 99;
  const glucosePrediabetesFastingMin = 100;
  const glucosePrediabetesFastingMax = 125;
  const glucosePostMealMax = 139;

  // Waga na podstawie BMI
  const bmiMin = 18.5;
  const bmiMax = 24.9;
  const weightMin = parseFloat((bmiMin * heightMeters ** 2).toFixed(1));
  const weightMax = parseFloat((bmiMax * heightMeters ** 2).toFixed(1));

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
  };
}
