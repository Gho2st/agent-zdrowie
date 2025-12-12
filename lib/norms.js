export function getHealthNorms(
  age,
  gender, // Oczekuje: "MALE" lub "FEMALE"
  height,
  weight,
  activityLevel, // Oczekuje: "LOW", "MODERATE", "HIGH"
  conditions = []
) {
  // --- 1. WALIDACJA WEJŚCIA ---
  if (age < 18 || age > 120) return { error: "Wiek musi wynosić 18–120 lat" };
  if (height < 50 || height > 250)
    return { error: "Wzrost musi wynosić 50–250 cm" };
  if (weight < 20 || weight > 300)
    return { error: "Waga musi wynosić 20–300 kg" };

  // Walidacja Enumów
  if (!["MALE", "FEMALE"].includes(gender)) {
    return { error: "Nieprawidłowa płeć" };
  }
  if (!["LOW", "MODERATE", "HIGH"].includes(activityLevel)) {
    return { error: "Nieprawidłowy poziom aktywności" };
  }

  // --- 2. PRZYGOTOWANIE DANYCH ---

  const heightM = height / 100;
  // Obliczamy BMI i zaokrąglamy do 1 miejsca po przecinku
  const bmi = parseFloat((weight / (heightM * heightM)).toFixed(1));

  // Normalizacja nazw chorób (lowercase)
  const normalizedConditions = conditions.map((c) => c.toLowerCase());

  // ESC 2024: Rozszerzona lista grup ryzyka (CVD, CKD, Cukrzyca, Nadciśnienie)
  // [cite: 1254, 1256, 1260]
  const highRiskKeywords = [
    "cukrzyca",
    "nadciśnienie",
    "choroba nerek",
    "ckd",
    "choroba serca",
    "cvd",
    "niewydolność serca",
  ];

  const hasHighRisk = normalizedConditions.some((condition) =>
    highRiskKeywords.includes(condition)
  );

  // --- 3. OBLICZENIA NORM (Specyfika POMIARÓW DOMOWYCH - HBPM) ---

  // A. Ciśnienie Krwi (HBPM wg ESC 2024 - Tabela 5)

  // 1. Definicja "Niepodwyższonego ciśnienia" (Idealne zdrowie w domu)
  // Tabela 5: SBP < 120 i DBP < 70 [cite: 1080, 1225]
  let systolicMax = 119;
  let diastolicMax = 69;

  // 2. Cel terapeutyczny (Grupy ryzyka)
  // ESC zaleca cel 120-129 (gabinet), co w domu przekłada się na podobne wartości.
  // Wartości te mieszczą się w kategorii "Podwyższone BP" dla HBPM (120-134),
  // ale poniżej progu nadciśnienia (który w domu wynosi ≥135).
  if (hasHighRisk) {
    systolicMax = 129;
    diastolicMax = 79;
  }

  // 3. Seniorzy ≥ 85 lat (Age Safety Guard)
  // Przesunięcie granicy z 65 na 85 lat[cite: 2197].
  // W domu nadciśnienie to ≥135/85 (odpowiednik gabinetowego 140/90).
  // Dlatego dla seniorów "bezpieczny" próg w domu to max 134/84.
  if (age >= 85) {
    systolicMax = 134; // < 135 mm Hg (HBPM)
    diastolicMax = 84; // < 85 mm Hg (HBPM)
  }

  // B. Glukoza (mg/dL) – ADA 2025
  const glucoseFastingMax = normalizedConditions.includes("cukrzyca")
    ? 130
    : 99;
  const glucosePostMealMax = normalizedConditions.includes("cukrzyca")
    ? 180
    : 140;

  // C. Waga docelowa (BMI 18.5–24.9)
  const weightMin = parseFloat((18.5 * heightM ** 2).toFixed(1));
  const weightMax = parseFloat((24.9 * heightM ** 2).toFixed(1));

  // D. Tętno (Serce Systemu - Aktualizacja AHA)

  // 1. Tętno Spoczynkowe (Resting HR)
  // Norma: 60-100 bpm. Dla sportowców ("HIGH") dolna granica to 40 bpm.
  const pulseMin = activityLevel === "HIGH" ? 40 : 60;
  const pulseMax = 100;

  // 2. Tętno Treningowe (Target HR)
  // Wzór: Max HR = 220 - wiek
  const maxHeartRate = 220 - age;

  // Strefy tętna wg American Heart Association:
  // Umiarkowana aktywność: ~50% Max HR
  // Intensywna aktywność: do ~85% Max HR
  const targetHeartRateMin = Math.round(maxHeartRate * 0.5);
  const targetHeartRateMax = Math.round(maxHeartRate * 0.85);

  // --- 4. ZWROT OBIEKTU (Zgodność z Prisma Schema) ---
  return {
    // Ciśnienie (wg ESC 2024 dla HBPM)
    systolicMin: 90, // Dolna granica bezpieczeństwa (hipotensja)
    systolicMax,
    diastolicMin: 60, // Fizjologiczne minimum
    diastolicMax,

    // Glukoza
    glucoseFastingMin: 70,
    glucoseFastingMax,
    glucosePostMealMax,

    // Waga
    weightMin,
    weightMax,
    bmi, // Float

    // Tętno Spoczynkowe
    pulseMin,
    pulseMax,

    // Tętno Treningowe
    maxHeartRate, // Int
    targetHeartRateMin, // Int
    targetHeartRateMax, // Int
  };
}
