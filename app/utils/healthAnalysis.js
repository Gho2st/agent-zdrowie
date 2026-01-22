export function analyzeMeasurement(
  type,
  value,
  norms,
  context = {},
  hasHighRisk = false,
) {
  if (!norms || value === null || value === undefined) {
    return {
      status: "UNKNOWN",
      message: "",
      isOutOfNorm: false,
      color: "gray",
    };
  }

  if (type === "BLOOD_PRESSURE") {
    const { sys, dia } = value;

    // 1. Krytyczne – zawsze pierwsze
    if (sys >= 180 || dia >= 120) {
      return {
        status: "CRITICAL",
        message: "⚠️ Przełom nadciśnieniowy! Natychmiastowa pomoc.",
        isOutOfNorm: true,
        color: "red",
      };
    }

    // 2. Hipotensja
    if (sys < 90 || dia < 60) {
      return {
        status: "LOW",
        message: "Zbyt niskie ciśnienie – obserwuj objawy.",
        isOutOfNorm: true,
        color: "blue",
        severity: "low",
      };
    }

    // 3. Najpierw zawsze sprawdzamy, czy przekroczono indywidualny cel
    const exceededTarget =
      (typeof norms?.systolicMax === "number" && sys > norms.systolicMax) ||
      (typeof norms?.diastolicMax === "number" && dia > norms.diastolicMax);

    if (exceededTarget) {
      return {
        status: "ALARM",
        message: `Powyżej celu leczenia (<${norms.systolicMax}/${norms.diastolicMax}). Skonsultuj lekarza.`,
        isOutOfNorm: true,
        color: "orange",
      };
    }

    // 4. Docelowy zakres leczenia (tylko jeśli nie przekroczono celu)
    if (sys <= 129 && dia <= 79) {
      return {
        status: "OPTIMAL",
        message: hasHighRisk
          ? "W docelowym zakresie leczenia (120–129/<80 mmHg)"
          : "Bardzo dobry wynik!",
        isOutOfNorm: false,
        color: "green",
      };
    }

    // 5. Elevated – tylko jeśli nie jest ani optimum, ani powyżej celu
    if (sys >= 120 || dia >= 70) {
      if (hasHighRisk) {
        return {
          status: "ELEVATED_HIGH_RISK",
          message:
            "Lekko powyżej optimum – rozważ korektę leczenia / stylu życia.",
          isOutOfNorm: false,
          color: "yellow",
        };
      } else {
        return {
          status: "ELEVATED",
          message:
            "Podwyższone ciśnienie – zadbaj o dietę, sól <5 g/dzień, ruch, wagę.",
          isOutOfNorm: false,
          color: "yellow",
        };
      }
    }

    // 6. Dobre, poniżej 120/70
    return {
      status: "OPTIMAL",
      message: hasHighRisk
        ? "Bardzo dobre – poniżej celu leczenia"
        : "W normie – super!",
      isOutOfNorm: false,
      color: "green",
    };
  }

  //   GLUKOZA
  if (type === "GLUCOSE") {
    const timing = context.timing; // "przed posiłkiem" lub "po posiłku"

    if (
      timing === "przed posiłkiem" &&
      norms.glucoseFastingMin &&
      norms.glucoseFastingMax
    ) {
      if (value < norms.glucoseFastingMin)
        return {
          status: "LOW",
          message: "Hipoglikemia (Cukier za niski)!",
          isOutOfNorm: true,
          color: "red",
        };
      if (value > norms.glucoseFastingMax)
        return {
          status: "HIGH",
          message: `Przekroczono normę na czczo (> ${norms.glucoseFastingMax}).`,
          isOutOfNorm: true,
          color: "orange",
        };
    }

    // Po posiłku
    if (timing === "po posiłku" && norms.glucosePostMealMax) {
      if (value > norms.glucosePostMealMax)
        return {
          status: "HIGH",
          message: `Przekroczono normę po posiłku (> ${norms.glucosePostMealMax}).`,
          isOutOfNorm: true,
          color: "orange",
        };
    }
  }

  // WAGA
  if (type === "WEIGHT" && norms.weightMin && norms.weightMax) {
    if (value < norms.weightMin)
      return {
        status: "LOW",
        message: "Waga poniżej normy BMI.",
        isOutOfNorm: true,
        color: "blue",
      };
    if (value > norms.weightMax)
      return {
        status: "HIGH",
        message: "Waga powyżej normy BMI.",
        isOutOfNorm: true,
        color: "orange",
      };
  }

  // TĘTNO

  if (type === "HEART_RATE") {
    const ctx = context?.context || "spoczynkowe";

    // 1. Zbyt niskie tętno
    if (value < norms.pulseMin) {
      return {
        status: "LOW",
        message:
          "Bradykardia – puls za niski. Jeśli masz zawroty głowy, osłabienie lub inne niepokojące objawy – skontaktuj się z lekarzem.",
        isOutOfNorm: true,
        color: "blue",
      };
    }

    // kontekst podczas treningu

    if (ctx === "podczas treningu") {
      // maksimum
      if (value > norms.maxHeartRate) {
        return {
          status: "CRITICAL",
          message: `Tętno przekracza Twoje maksymalne (${norms.maxHeartRate} bpm)! Natychmiast przerwij wysiłek i odpocznij!`,
          isOutOfNorm: true,
          color: "red",
        };
      }

      // docelowy zakres treningowy ponizej i powyzej
      if (value < norms.targetHeartRateMin) {
        return {
          status: "BELOW_TARGET",
          message: `Tętno poniżej Twojej docelowej strefy (${norms.targetHeartRateMin}–${norms.targetHeartRateMax} bpm). Możesz trochę przyspieszyć.`,
          isOutOfNorm: true,
          color: "yellow",
        };
      }

      if (value > norms.targetHeartRateMax) {
        return {
          status: "ABOVE_TARGET",
          message: `Tętno powyżej Twojej docelowej strefy (${norms.targetHeartRateMin}–${norms.targetHeartRateMax} bpm). Zwolnij lub zrób krótką przerwę.`,
          isOutOfNorm: true,
          color: "orange",
        };
      }

      // w zakresie treningu super wynik
      return {
        status: "IN_TARGET",
        message: `Tętno idealnie w docelowej strefie treningowej (${norms.targetHeartRateMin}–${norms.targetHeartRateMax} bpm) – kontynuuj! 💪`,
        isOutOfNorm: false,
        color: "green",
      };
    }

    // powyzej pulse max w spocznku

    if (value > norms.pulseMax) {
      return {
        status: "HIGH",
        message: `Tachykardia – puls za wysoki w spoczynku (${value} bpm, norma do ${norms.pulseMax}). Odpocznij, zmierz ponownie za kilka minut i obserwuj.`,
        isOutOfNorm: true,
        color: "orange",
      };
    }

    // wszystko w normie
    return {
      status: "OPTIMAL",
      message: `Tętno spoczynkowe w normie (${value} bpm) – bardzo dobrze!`,
      isOutOfNorm: false,
      color: "green",
    };
  }

  return { status: "OK", message: "", isOutOfNorm: false, color: "green" };
}
