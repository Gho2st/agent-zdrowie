import { useEffect, useState } from "react";

export default function useHealthChartData(type, refreshKey) {
  // Stan przechowuje dane typu Measurement[] i Norms
  const [data, setData] = useState([]);
  const [norms, setNorms] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Równoległe pobieranie danych
        const [mRes, nRes] = await Promise.all([
          fetch("/api/measurement"),
          fetch("/api/user/norms"),
        ]);

        if (!mRes.ok || !nRes.ok) {
          throw new Error("Błąd pobierania danych");
        }

        const measurements = await mRes.json();
        const normsData = await nRes.json();

        if (!Array.isArray(measurements)) {
          setData([]);
        } else {
          // Filtrowanie i ustawianie danych
          setData(measurements.filter((m) => m.type === type));
        }

        setNorms(normsData ?? null);
      } catch (error) {
        console.error("Błąd w hooku useHealthChartData:", error);
        setData([]);
        setNorms(null);
      }
    };

    fetchData();
  }, [type, refreshKey]); // Zależności pozostały

  // Przetwarzanie danych poza useEffect
  const prepared = data
    .map((m) => {
      const date = new Date(m.createdAt);
      let value; // Deklaracja bez typu

      if (
        type === "ciśnienie" &&
        typeof m.systolic === "number" &&
        typeof m.diastolic === "number"
      ) {
        value = [m.systolic, m.diastolic];
      } else {
        value = Number(m.amount ?? 0);
      }

      return { date, value };
    })
    // Filtrowanie niepoprawnych dat
    .filter((m) => !isNaN(m.date.getTime()))
    // Sortowanie od najnowszego
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    // Ograniczenie do 7 najnowszych wpisów
    .slice(0, 7);

  return { prepared, norms };
}
