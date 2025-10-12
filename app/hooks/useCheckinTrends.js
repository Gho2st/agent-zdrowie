import { useEffect, useState } from "react";

export default function useCheckinTrends(refreshKey) {
  // TypeScript typy zostały usunięte. 'refreshKey' jest niejawnie typu 'any' lub 'undefined'.

  // Stan przechowuje obiekty, które odpowiadają interfejsowi CheckinTrend (ale bez jawnej deklaracji typu)
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        setLoading(true);
        // Użycie backticków i template stringów jest standardowe w JS
        const res = await fetch("/api/checkin-trends?days=7", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Błąd pobierania danych");

        const data = await res.json();

        if (Array.isArray(data)) {
          setTrends(data);
        } else {
          setTrends([]); // fallback, gdyby coś poszło nie tak
        }
      } catch (err) {
        // err jest typu 'any' w JS
        setError("Nie udało się pobrać trendów");
        console.error(err);
        setTrends([]); // zabezpieczenie
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
  }, [refreshKey]); // Zależność 'refreshKey' pozostaje

  return { trends, loading, error };
}
