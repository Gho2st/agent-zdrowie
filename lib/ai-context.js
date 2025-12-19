export function buildPersonalizedContext(user) {
  if (!user) return "Brak danych pacjenta.";

  const fmtDate = (d) =>
    new Date(d).toLocaleString("pl-PL", {
      dateStyle: "short",
      timeStyle: "short",
    });

  // --- POMOCNICZE FUNKCJE ---

  const getGender = () => {
    const g = user.gender;
    if (g === "MALE") return "mężczyzna";
    if (g === "FEMALE") return "kobieta";
    return "nie podano";
  };

  const calculateAge = (birthdate) => {
    if (!birthdate) return null;
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };

  // --- BUDOWANIE LISTY CHORÓB ---

  const mainConditions = [];
  if (user.hasDiabetes) mainConditions.push("cukrzyca");
  if (user.hasPrediabetes) mainConditions.push("stan przedcukrzycowy");
  if (user.hasHypertension) mainConditions.push("nadciśnienie tętnicze");
  if (user.hasHeartDisease) mainConditions.push("choroby sercowo-naczyniowe");
  if (user.hasKidneyDisease) mainConditions.push("przewlekła choroba nerek");

  // Dodatkowe schorzenia (np. astma, alergie, Hashimoto)
  let additionalConditions = "";
  if (user.conditions) {
    if (typeof user.conditions === "string") {
      additionalConditions = user.conditions.trim();
    } else if (Array.isArray(user.conditions)) {
      if (
        user.conditions.length > 0 &&
        typeof user.conditions[0] === "object"
      ) {
        additionalConditions = user.conditions.map((c) => c.name).join(", ");
      } else {
        additionalConditions = user.conditions.join(", ");
      }
    }
  }

  const allConditionsArray = [...mainConditions];
  if (additionalConditions) {
    allConditionsArray.push(additionalConditions);
  }

  const conditionsDisplay =
    allConditionsArray.length > 0
      ? allConditionsArray.join(", ")
      : "brak zdiagnozowanych chorób";

  // --- BUDOWANIE NORM ---

  const norms = {
    ciśnienie:
      user.systolicMax && user.diastolicMax
        ? `${user.systolicMin || 90}–${user.systolicMax}/${
            user.diastolicMin || 60
          }–${user.diastolicMax} mmHg`
        : "domyślne (<120/80 mmHg)",
    glukoza_na_czczo: user.glucoseFastingMax
      ? `${user.glucoseFastingMin || 70}–${user.glucoseFastingMax} mg/dL`
      : "domyślne (70–99 mg/dL)",
    glukoza_po_posiłku: user.glucosePostMealMax
      ? `≤ ${user.glucosePostMealMax} mg/dL`
      : "domyślne (<140 mg/dL)",
    waga_docelowa:
      user.weightMin && user.weightMax
        ? `${user.weightMin}–${user.weightMax} kg`
        : "brak danych",
    tętno_spoczynkowe:
      user.pulseMin && user.pulseMax
        ? `${user.pulseMin}–${user.pulseMax} bpm`
        : "domyślne (60–100 bpm)",
  };

  // --- PROFIL PACJENTA ---

  const profile = {
    Wiek: calculateAge(user.birthdate),
    Płeć: getGender(),
    Wzrost: user.height ? `${user.height} cm` : null,
    Waga: user.weight ? `${user.weight} kg` : null,
    BMI:
      user.weight && user.height
        ? Number((user.weight / (user.height / 100) ** 2).toFixed(1))
        : null,
    "Poziom aktywności": user.activityLevel
      ? user.activityLevel === "LOW"
        ? "niski"
        : user.activityLevel === "MODERATE"
        ? "umiarkowany"
        : user.activityLevel === "HIGH"
        ? "wysoki"
        : user.activityLevel
      : "nie podano",
    Choroby: conditionsDisplay,
    "Kluczowe schorzenia": {
      cukrzyca: user.hasDiabetes ? "tak" : "nie",
      stan_przedcukrzycowy: user.hasPrediabetes ? "tak" : "nie",
      nadciśnienie: user.hasHypertension ? "tak" : "nie",
      choroby_serca: user.hasHeartDisease ? "tak" : "nie",
      przewlekła_choroba_nerek: user.hasKidneyDisease ? "tak" : "nie",
    },
    Leki: user.medications || "brak informacji",
    Normy: norms,
  };

  // --- POMIARY ---

  const measurementsList =
    user.measurements && user.measurements.length > 0
      ? user.measurements
          .map((m) => {
            let typePL = m.type;
            let valueStr = "";

            switch (m.type) {
              case "BLOOD_PRESSURE":
              case "ciśnienie":
                typePL = "Ciśnienie";
                const sys = m.value ?? m.systolic;
                const dia = m.value2 ?? m.diastolic;
                valueStr = `${sys}/${dia}`;
                break;
              case "WEIGHT":
              case "waga":
                typePL = "Waga";
                valueStr = `${m.value ?? m.amount}`;
                break;
              case "GLUCOSE":
              case "cukier":
              case "glukoza":
                typePL = "Glukoza";
                valueStr = `${m.value ?? m.amount}`;
                break;
              case "HEART_RATE":
              case "tętno":
                typePL = "Tętno";
                valueStr = `${m.value ?? m.amount}`;
                break;
              default:
                valueStr = `${m.value ?? m.amount ?? "-"}`;
            }

            const unitStr = m.unit ? ` ${m.unit}` : "";
            const contextStr = m.context ? ` (${m.context})` : "";

            return `${fmtDate(
              m.createdAt
            )} → ${typePL}: ${valueStr}${unitStr}${contextStr}`;
          })
          .join("\n")
      : "brak ostatnich pomiarów";

  // --- SAMOPOCZUCIE ---

  const checkinsList =
    user.dailyCheckins && user.dailyCheckins.length > 0
      ? user.dailyCheckins
          .slice(0, 7)
          .map((c) => {
            const parts = [
              c.mood !== undefined && c.mood !== null
                ? `Nastrój: ${c.mood}/5`
                : null,
              c.sleep !== undefined && c.sleep !== null
                ? `Sen: ${c.sleep}/5`
                : null,
              c.energy !== undefined && c.energy !== null
                ? `Energia: ${c.energy}/5`
                : null,
              c.stress !== undefined && c.stress !== null
                ? `Stres: ${c.stress}/5`
                : null,
            ].filter(Boolean);

            return `${fmtDate(c.date)}: ${parts.join(" | ") || "brak danych"}`;
          })
          .join("\n")
      : "brak danych o samopoczuciu";

  // --- KOŃCOWY KONTEKST ---

  return `
PROFIL PACJENTA (strukturalny JSON):
${JSON.stringify(profile, null, 2)}

NAJNOWSZE POMIARY (do 20 ostatnich):
${measurementsList}

SAMOPOCZUCIE (ostatnie 7 dni):
${checkinsList}
`.trim();
}
