import { MeasurementType } from "@prisma/client";

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

  if (type === MeasurementType.BLOOD_PRESSURE) {
    const { sys, dia } = value;

    // 1. Krytyczne – zawsze pierwsze
    if (sys >= 180 || dia >= 120) {
      return {
        status: "CRITICAL",
        message: "⚠️ Bardzo wysokie ciśnienie – przełom nadciśnieniowy.",
        isOutOfNorm: true,
        color: "red",
      };
    }

    // 2. Hipotensja
    if (sys < norms.systolicMin || dia < norms.diastolicMin) {
      return {
        status: "LOW",
        message: "Ciśnienie wyraźnie za niskie.",
        isOutOfNorm: true,
        color: "blue",
      };
    }

    // 3. Normy i przekroczenia
    if (sys <= norms.optimalSystolicMax && dia <= norms.optimalDiastolicMax) {
      return {
        status: "OPTIMAL",
        message:
          "Świetnie! Ciśnienie w najlepszym możliwym zakresie 🎯 Idealnie!",
        isOutOfNorm: false,
        color: "green",
      };
    }
    // przekroczone optimum → sprawdzamy czy to już elevated czy alarm
    if (sys > norms.elevatedSystolicMax || dia > norms.elevatedDiastolicMax) {
      return {
        status: "ALARM",
        message: hasHighRisk
          ? `Twoje dzisiejsze ciśnienie niestety przekracza cel terapeutyczny (< ${norms.optimalSystolicMax}/${norms.optimalDiastolicMax}).`
          : "Pomiar sugerujący nadciśnienie.",
        isOutOfNorm: true,
        color: "red",
      };
    }

    // pozostaje zakres elevated
    return {
      status: hasHighRisk ? "THERAPY_TARGET_EXCEEDED" : "ELEVATED",
      message: hasHighRisk
        ? `Twoje dzisiejsze ciśnienie niestety przekracza cel terapeutyczny (< ${norms.optimalSystolicMax}/${norms.optimalDiastolicMax}).`
        : "Ciśnienie w strefie podwyższonej",
      isOutOfNorm: true,
      color: "orange",
    };
  }

  //   GLUKOZA
  if (type === MeasurementType.GLUCOSE) {
    const timing = context.timing || "przed posiłkiem";

    // Poziom 2 Hipoglikemii (< 54 mg/dL) - Stan KRYTYCZNY
    if (value < 54) {
      return {
        status: "CRITICAL",
        message: "⚠️ KRYTYCZNIE NISKI CUKIER (<54 mg/dL).",
        isOutOfNorm: true,
        color: "red",
      };
    }

    //  Hiperglikemia  (>= 250 mg/dL)
    if (value >= 250) {
      return {
        status: "CRITICAL",
        message:
          "⚠️ Bardzo wysoki poziom cukru (≥250 mg/dL).",
        isOutOfNorm: true,
        color: "red",
      };
    }

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
  if (type === MeasurementType.WEIGHT && norms.weightMin && norms.weightMax) {
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

  if (type === MeasurementType.HEART_RATE) {
    const ctx = context?.context || "spoczynkowe";

    // 1. Zbyt niskie tętno
    if (value < norms.pulseMin) {
      return {
        status: "LOW",
        message: "Bradykardia – puls za niski",
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
          message: `Tętno przekracza Twoje maksymalne (${norms.maxHeartRate} bpm)!`,
          isOutOfNorm: true,
          color: "red",
        };
      }

      // docelowy zakres treningowy ponizej i powyzej
      if (value < norms.targetHeartRateMin) {
        return {
          status: "BELOW_TARGET",
          message: `Tętno poniżej Twojej docelowej strefy (${norms.targetHeartRateMin}–${norms.targetHeartRateMax} bpm).`,
          isOutOfNorm: true,
          color: "yellow",
        };
      }

      if (value > norms.targetHeartRateMax) {
        return {
          status: "ABOVE_TARGET",
          message: `Tętno powyżej Twojej docelowej strefy (${norms.targetHeartRateMin}–${norms.targetHeartRateMax} bpm).`,
          isOutOfNorm: true,
          color: "orange",
        };
      }

      // w zakresie treningu super wynik
      return {
        status: "IN_TARGET",
        message: `Tętno idealnie w docelowej strefie treningowej (${norms.targetHeartRateMin}–${norms.targetHeartRateMax} bpm)`,
        isOutOfNorm: false,
        color: "green",
      };
    }

    // powyzej pulse max w spocznku

    if (value > norms.pulseMax) {
      return {
        status: "HIGH",
        message: `Tachykardia – puls za wysoki w spoczynku (${value} bpm, norma do ${norms.pulseMax}).`,
        isOutOfNorm: true,
        color: "orange",
      };
    }

    // wszystko w normie
    return {
      status: "OPTIMAL",
      message: `Tętno spoczynkowe w normie (${value} bpm)`,
      isOutOfNorm: false,
      color: "green",
    };
  }

  return { status: "OK", message: "", isOutOfNorm: false, color: "green" };
}
