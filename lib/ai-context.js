export function buildPersonalizedContext(user) {
  if (!user) return "Brak danych pacjenta.";

  // --- HELPERY DO BEZPIECZNEGO DOSTĘPU DANYCH ---

  // Próbuje znaleźć wartość na poziomie usera, potem w healthProfile, potem w norms
  const getValue = (key) => {
    if (user[key] !== undefined) return user[key];
    if (user.healthProfile && user.healthProfile[key] !== undefined)
      return user.healthProfile[key];
    if (
      user.healthProfile?.norms &&
      user.healthProfile.norms[key] !== undefined
    )
      return user.healthProfile.norms[key];
    return undefined;
  };

  const fmtDate = (d) =>
    new Date(d).toLocaleString("pl-PL", {
      dateStyle: "short",
      timeStyle: "short",
    });

  // --- LOGIKA NORMALIZACJI DANYCH ---

  const getConditions = () => {
    const raw = getValue("conditions");
    if (!raw) return "brak";

    // Przypadek 1: String "cukrzyca, nadciśnienie"
    if (typeof raw === "string") return raw;

    // Przypadek 2: Tablica obiektów [{ name: "cukrzyca" }] (Prisma relation)
    if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === "object") {
      return raw.map((c) => c.name).join(", ");
    }

    // Przypadek 3: Tablica stringów ["cukrzyca"]
    if (Array.isArray(raw)) {
      return raw.join(", ");
    }

    return "brak";
  };

  const getGender = () => {
    const g = getValue("gender");
    if (g === "MALE" || g === "M") return "mężczyzna";
    if (g === "FEMALE" || g === "K") return "kobieta";
    return "nie podano";
  };

  // --- BUDOWANIE PROFILU ---

  // Pobieramy dane używając helpera getValue, który "przeszukuje" obiekt
  const birthdate = getValue("birthdate");
  const bmi = getValue("bmi");
  const activity = getValue("activityLevel");
  const medications = getValue("medications");

  // Pobieranie norm
  const systolicMin = getValue("systolicMin");
  const systolicMax = getValue("systolicMax");
  const diastolicMin = getValue("diastolicMin");
  const diastolicMax = getValue("diastolicMax");
  const glucFastingMin = getValue("glucoseFastingMin");
  const glucFastingMax = getValue("glucoseFastingMax");
  const glucPostMeal = getValue("glucosePostMealMax");
  const wMin = getValue("weightMin");
  const wMax = getValue("weightMax");
  const pMin = getValue("pulseMin");
  const pMax = getValue("pulseMax");

  const profile = {
    Wiek: birthdate
      ? new Date().getFullYear() - new Date(birthdate).getFullYear()
      : null,
    Płeć: getGender(),
    BMI: bmi ? Number(bmi).toFixed(1) : null,
    "Poziom aktywności":
      activity === "LOW"
        ? "Niski"
        : (activity === "HIGH"
            ? "Wysoki"
            : activity === "MODERATE"
            ? "Umiarkowany"
            : activity) || "nie podano",
    Choroby: getConditions(),
    Leki: medications || "brak",
    Normy: {
      ciśnienie:
        systolicMax && diastolicMax
          ? `${systolicMin || 90}–${systolicMax}/${
              diastolicMin || 60
            }–${diastolicMax} mmHg`
          : "domyślne (<120/80)",
      glukoza_na_czczo: glucFastingMax
        ? `${glucFastingMin || 70}–${glucFastingMax} mg/dL`
        : "domyślne (70-99)",
      glukoza_po_posiłku: glucPostMeal
        ? `≤ ${glucPostMeal} mg/dL`
        : "domyślne (<140)",
      waga_docelowa: wMin && wMax ? `${wMin}–${wMax} kg` : "brak danych",
      tętno_spoczynkowe: pMin && pMax ? `${pMin}–${pMax} bpm` : "60-100 bpm",
    },
  };

  // --- FORMATOWANIE POMIARÓW ---

  const measurementsList =
    user.measurements && user.measurements.length > 0
      ? user.measurements
          .map((m) => {
            let valueStr = "";
            let typePL = m.type;

            // Obsługa starej i nowej schemy (amount/systolic vs value/value2)
            // oraz mapowanie typów ENUM -> PL

            switch (m.type) {
              case "BLOOD_PRESSURE":
              case "ciśnienie":
                typePL = "Ciśnienie";
                // Nowa schema używa value/value2, stara systolic/diastolic
                const sys = m.value ?? m.systolic;
                const dia = m.value2 ?? m.diastolic;
                valueStr = `${sys}/${dia}`;
                break;

              case "WEIGHT":
              case "waga":
                typePL = "Waga";
                valueStr = m.value ?? m.amount;
                break;

              case "GLUCOSE":
              case "cukier":
              case "glukoza":
                typePL = "Glukoza";
                valueStr = m.value ?? m.amount;
                break;

              case "HEART_RATE":
              case "tętno":
                typePL = "Tętno";
                valueStr = m.value ?? m.amount;
                break;

              default:
                valueStr = m.value ?? m.amount;
            }

            const unitStr = m.unit ? ` ${m.unit}` : "";
            const contextStr = m.context ? ` (${m.context})` : "";

            return `${fmtDate(
              m.createdAt
            )} → ${typePL}: ${valueStr}${unitStr}${contextStr}`;
          })
          .join("\n")
      : "brak ostatnich pomiarów";

  // --- FORMATOWANIE SAMOPOCZUCIA ---

  const checkinsList =
    user.dailyCheckins && user.dailyCheckins.length > 0
      ? user.dailyCheckins
          .slice(0, 7)
          .map((c) => {
            // Jeśli w nowej bazie są liczby (Int), wyświetlamy je jako "N: 3/5"
            // Jeśli stringi, wyświetlamy tekst
            const formatVal = (label, v) => {
              if (v === undefined || v === null) return null;
              return `${label}: ${v}`;
            };

            const parts = [
              formatVal("Nastrój", c.mood),
              formatVal("Sen", c.sleep),
              formatVal("Energia", c.energy),
              formatVal("Stres", c.stress),
            ].filter(Boolean);

            return `${fmtDate(c.date)}: ${parts.join(" | ")}`;
          })
          .join("\n")
      : "brak danych o samopoczuciu";

  return `
PROFIL PACJENTA (strukturalny JSON):
${JSON.stringify(profile, null, 2)}

NAJNOWSZE POMIARY (max 20):
${measurementsList}

SAMOPOCZUCIE (ostatnie 7 dni):
${checkinsList}
`.trim();
}
