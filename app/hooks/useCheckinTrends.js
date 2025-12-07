import { useEffect, useState } from "react";

export default function useCheckinTrends(refreshKey) {
  // Stan przechowuje obiekty, które odpowiadają interfejsowi CheckinTrend
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        setLoading(true);
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
        setError("Nie udało się pobrać trendów");
        console.error(err);
        setTrends([]); // zabezpieczenie
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
  }, [refreshKey]);

  return { trends, loading, error };
}
