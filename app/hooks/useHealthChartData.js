import { useEffect, useState } from "react";

// Mapowanie polskich nazw (używanych w komponentach) na Enumy z bazy Prisma
const TYPE_MAP = {
  cukier: "GLUCOSE",
  waga: "WEIGHT",
  ciśnienie: "BLOOD_PRESSURE",
  tętno: "HEART_RATE",
  // Obsługa nazw bezpośrednich (gdyby frontend wysłał już Enuma)
  GLUCOSE: "GLUCOSE",
  WEIGHT: "WEIGHT",
  BLOOD_PRESSURE: "BLOOD_PRESSURE",
  HEART_RATE: "HEART_RATE",
};

export default function useHealthChartData(type, refreshKey) {
  const [data, setData] = useState([]);
  const [norms, setNorms] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mRes, nRes] = await Promise.all([
          fetch("/api/measurement"),
          fetch("/api/user/norms"),
        ]);

        if (!mRes.ok || !nRes.ok) {
          throw new Error("Błąd pobierania danych");
        }

        const measurements = await mRes.json();
        const normsData = await nRes.json();

        // Ustalenie, jakiego Enuma szukamy w bazie
        const targetType = TYPE_MAP[type] || type;

        if (!Array.isArray(measurements)) {
          setData([]);
        } else {
          // Filtrujemy surowe dane po typie (np. BLOOD_PRESSURE)
          // Obsługujemy też fallback do starej nazwy, jeśli API zwraca zmapowane
          const filtered = measurements.filter(
            (m) => m.type === targetType || m.type === type
          );
          setData(filtered);
        }

        // API /api/user/norms zwraca teraz obiekt { user: { ...normy } } lub bezpośrednio normy
        // Zależnie od implementacji endpointu. Zakładamy bezpieczny dostęp.
        setNorms(normsData.user || normsData || null);
      } catch (error) {
        console.error("Błąd w hooku useHealthChartData:", error);
        setData([]);
        setNorms(null);
      }
    };

    fetchData();
  }, [type, refreshKey]);

  // Przetwarzanie danych
  const prepared = data
    .map((m) => {
      const date = new Date(m.createdAt);
      let value;

      // Logika dla Ciśnienia (potrzebujemy dwóch wartości)
      if (type === "ciśnienie" || m.type === "BLOOD_PRESSURE") {
        // Nowa baza: value = skurczowe, value2 = rozkurczowe
        // Stare API (mapowane): systolic, diastolic
        const sys = m.value ?? m.systolic;
        const dia = m.value2 ?? m.diastolic;

        if (typeof sys === "number" && typeof dia === "number") {
          value = [sys, dia];
        }
      } else {
        // Logika dla Wagi, Cukru, Tętna (jedna wartość)
        // Nowa baza: value, Stare API: amount
        value = Number(m.value ?? m.amount ?? 0);
      }

      return { date, value };
    })
    .filter((m) => !isNaN(m.date.getTime()) && m.value !== undefined)
    // 1. Sortujemy malejąco, żeby wziąć najnowsze wpisy
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    // 2. Bierzemy 7 ostatnich
    .slice(0, 7)
    // 3. Odwracamy kolejność, żeby na wykresie było chronologicznie (Lewo: stare -> Prawo: nowe)
    .reverse();

  return { prepared, norms };
}
