export function buildPersonalizedContext(user) {
  const fmt = (d) =>
    new Date(d).toLocaleString("pl-PL", {
      dateStyle: "short",
      timeStyle: "short",
    });

  const getConditions = () => {
    if (!user.conditions) return "brak";

    if (Array.isArray(user.conditions)) {
      return user.conditions.length > 0 ? user.conditions.join(", ") : "brak";
    }

    if (typeof user.conditions === "string") {
      const items = user.conditions
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      return items.length > 0 ? items.join(", ") : "brak";
    }

    return "brak";
  };

  const profile = {
    Wiek: user.birthdate
      ? new Date().getFullYear() - new Date(user.birthdate).getFullYear()
      : null,
    Płeć:
      user.gender === "M"
        ? "mężczyzna"
        : user.gender === "K"
        ? "kobieta"
        : null,
    BMI: user.bmi ? Number(user.bmi).toFixed(1) : null,
    "Poziom aktywności": user.activityLevel || "nie podano",
    Choroby: getConditions(),
    Leki: user.medications || "brak",
    Normy: {
      ciśnienie: `${user.systolicMin}–${user.systolicMax}/${user.diastolicMin}–${user.diastolicMax} mmHg`,
      glukoza_na_czczo: `${user.glucoseFastingMin}–${user.glucoseFastingMax} mg/dL`,
      glukoza_po_posiłku: `≤ ${user.glucosePostMealMax} mg/dL`,
      waga_docelowa: `${user.weightMin}–${user.weightMax} kg`,
      tętno_spoczynkowe: `${user.pulseMin}–${user.pulseMax} bpm`,
    },
  };

  const measurements =
    user.measurements && user.measurements.length > 0
      ? user.measurements
          .map((m) => {
            const value =
              m.type === "ciśnienie"
                ? `${m.systolic}/${m.diastolic}`
                : m.amount;
            const context = m.context ? ` (${m.context})` : "";
            return `${fmt(m.createdAt)} → ${m.type}: ${value} ${
              m.unit
            }${context}`;
          })
          .join("\n")
      : "brak";

  const checkins =
    user.dailyCheckins && user.dailyCheckins.length > 0
      ? user.dailyCheckins
          .slice(0, 7)
          .map((c) => {
            const values = [c.mood, c.sleep, c.energy, c.stress]
              .filter(Boolean)
              .map((v) => v.charAt(0).toUpperCase() + v.slice(1))
              .join(" | ");
            return `${fmt(c.date)}: ${values || "brak danych"}`;
          })
          .join("\n")
      : "brak";

  return `
PROFIL PACJENTA (strukturalny JSON):
${JSON.stringify(profile, null, 2)}

NAJNOWSZE POMIARY (do 10):
${measurements}

SAMOPOCZUCIE (ostatnie 7 dni):
${checkins}
`.trim();
}
