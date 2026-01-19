// lib/ai-context.js

function calculateAge(birthdate) {
  if (!birthdate) return "nieznany";
  const today = new Date();
  const birth = new Date(birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

const fmtDate = (d) =>
  new Date(d).toLocaleString("pl-PL", {
    dateStyle: "short",
    timeStyle: "short",
  });

// Oblicza statystyki
export function calculateStats(measurements, norms, checkins) {
  const stats = {};

  //  Obliczanie statystyk pomiarów fizycznych ---
  measurements.forEach((m) => {
    if (!stats[m.type]) {
      stats[m.type] = {
        count: 0,
        sum: 0,
        sum2: 0,
        min: 9999,
        max: 0,
        alarms: 0,
      };
    }
    const s = stats[m.type];
    const val = parseFloat(m.value);
    const val2 = m.value2 ? parseFloat(m.value2) : 0;

    s.count++;
    s.sum += val;
    if (val2) s.sum2 += val2;

    if (val < s.min) s.min = val;
    if (val > s.max) s.max = val;

    let isAlarm = false;
    if (m.type === "BLOOD_PRESSURE") {
      if (norms.systolicMax && val > norms.systolicMax) isAlarm = true;
      if (norms.systolicMin && val < norms.systolicMin) isAlarm = true;
      if (norms.diastolicMax && val2 > norms.diastolicMax) isAlarm = true;
      if (norms.diastolicMin && val2 < norms.diastolicMin) isAlarm = true;
    } else if (m.type === "GLUCOSE") {
      if (norms.glucoseFastingMax && val > norms.glucoseFastingMax)
        isAlarm = true;
      if (norms.glucoseFastingMin && val < norms.glucoseFastingMin)
        isAlarm = true;
    } else if (m.type === "HEART_RATE") {
      if (norms.pulseMax && val > norms.pulseMax) isAlarm = true;
      if (norms.pulseMin && val < norms.pulseMin) isAlarm = true;
    }

    if (isAlarm) s.alarms++;
  });

  // Konwersja pomiarów na tekst
  const lines = Object.entries(stats).map(([type, data]) => {
    const avg1 = (data.sum / data.count).toFixed(0);
    const avg2 = data.sum2 ? "/" + (data.sum2 / data.count).toFixed(0) : "";

    let name = type;
    if (type === "BLOOD_PRESSURE") name = "Ciśnienie";
    if (type === "HEART_RATE") name = "Tętno";
    if (type === "GLUCOSE") name = "Glukoza";
    if (type === "WEIGHT") name = "Waga";

    return `${name}: Średnia ${avg1}${avg2}, Zakres [${data.min}-${data.max}], Poza normą: ${data.alarms} z ${data.count}`;
  });

  //  Obliczanie średnich samopoczucia
  if (checkins && checkins.length > 0) {
    let moodSum = 0,
      moodCount = 0;
    let sleepSum = 0,
      sleepCount = 0;
    let stressSum = 0,
      stressCount = 0;

    checkins.forEach((c) => {
      // Sprawdzamy, czy pole istnieje (użytkownik mógł pominąć np. sen)
      if (c.mood) {
        moodSum += Number(c.mood);
        moodCount++;
      }
      if (c.sleep) {
        sleepSum += Number(c.sleep);
        sleepCount++;
      }
      if (c.stress) {
        stressSum += Number(c.stress);
        stressCount++;
      }
    });

    const parts = [];
    if (moodCount > 0)
      parts.push(`Nastrój: ${(moodSum / moodCount).toFixed(1)}/5`);
    if (sleepCount > 0)
      parts.push(`Sen: ${(sleepSum / sleepCount).toFixed(1)}/5`);
    if (stressCount > 0)
      parts.push(`Stres: ${(stressSum / stressCount).toFixed(1)}/5`);

    if (parts.length > 0) {
      lines.push(
        `Samopoczucie (średnia z ${checkins.length} dni): ${parts.join(", ")}`,
      );
    }
  }

  return lines;
}

// 2. Buduje kontekst
export function buildPersonalizedContext(
  profile,
  norms,
  statsText,
  recentMeasurements,
  recentCheckins,
) {
  const age = calculateAge(profile?.birthdate);
  const gender =
    profile?.gender === "MALE"
      ? "Mężczyzna"
      : profile?.gender === "FEMALE"
        ? "Kobieta"
        : "Nie podano";

  const conditionsList =
    profile?.conditions && profile.conditions.length > 0
      ? profile.conditions.map((c) => c.name).join(", ")
      : "Brak udokumentowanych schorzeń";

  const formatRange = (min, max, unit = "") => {
    if (min && max) return `${min}–${max}${unit}`;
    if (max) return `< ${max}${unit}`;
    if (min) return `> ${min}${unit}`;
    return null;
  };

  const sysRange = formatRange(norms?.systolicMin, norms?.systolicMax);
  const diaRange = formatRange(norms?.diastolicMin, norms?.diastolicMax);
  const pulseRange = formatRange(norms?.pulseMin, norms?.pulseMax, " bpm");
  const glucoseRange = formatRange(
    norms?.glucoseFastingMin,
    norms?.glucoseFastingMax,
  );
  const weightRange = formatRange(norms?.weightMin, norms?.weightMax, " kg");

  const normsText =
    [
      sysRange || diaRange
        ? `BP cel: ${sysRange || "?"} / ${diaRange || "?"} mmHg`
        : null,
      glucoseRange ? `Glukoza (czczo) cel: ${glucoseRange} mg/dL` : null,
      pulseRange ? `Tętno cel: ${pulseRange}` : null,
      weightRange ? `Waga cel: ${weightRange}` : null,
    ]
      .filter(Boolean)
      .join(", ") || "Standardowe normy medyczne (brak indywidualnych)";

  // Pomiary (dla AI tylko z ostatniego miesiąca)
  const measurementsListStr =
    recentMeasurements.length > 0
      ? recentMeasurements
          .map((m) => {
            let typePL = m.type;
            let valueStr = "";
            switch (m.type) {
              case "BLOOD_PRESSURE":
                typePL = "Ciśnienie";
                valueStr = `${m.value}/${m.value2 || 0} mmHg`;
                break;
              case "WEIGHT":
                typePL = "Waga";
                valueStr = `${m.value} kg`;
                break;
              case "GLUCOSE":
                typePL = "Glukoza";
                valueStr = `${m.value} mg/dL`;
                break;
              case "HEART_RATE":
                typePL = "Tętno";
                valueStr = `${m.value} bpm`;
                break;
              default:
                valueStr = `${m.value}`;
            }
            return `- ${fmtDate(m.createdAt)}: ${typePL} ${valueStr}${m.context ? ` (${m.context})` : ""}`;
          })
          .join("\n")
      : "Brak pomiarów w tym okresie.";

  // Samopoczucie (dla AI tylko z ostatniego miesiąca)
  const checkinsListStr =
    recentCheckins && recentCheckins.length > 0
      ? recentCheckins
          .map((c) => {
            const parts = [];
            if (c.mood) parts.push(`Nastrój: ${c.mood}/5`);
            if (c.sleep) parts.push(`Sen: ${c.sleep}/5`);
            if (c.stress) parts.push(`Stres: ${c.stress}/5`);
            return `${new Date(c.date).toLocaleDateString("pl-PL")}: ${parts.join(" | ")}`;
          })
          .join("\n")
      : "Brak danych o samopoczuciu w tym okresie.";

  return `
RAPORT MEDYCZNY PACJENTA
=========================
DANE PACJENTA:
- Wiek: ${age} lat, Płeć: ${gender}
- Rozpoznania: ${conditionsList}
- Cele terapeutyczne (Normy): ${normsText}

STATYSTYKI (Z całego okresu raportu):
${statsText}

SAMOPOCZUCIE (Ostatni okres/miesiąc):
${checkinsListStr}

SZCZEGÓŁOWE POMIARY (Ostatni okres/miesiąc):
${measurementsListStr}
`.trim();
}
