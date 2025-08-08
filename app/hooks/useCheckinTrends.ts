import { useEffect, useState } from "react";

export type CheckinTrend = {
  date: string; // ISO string
  sleep?: string;
  stress?: string;
  energy?: string;
};

export default function useCheckinTrends(refreshKey?: number) {
  const [trends, setTrends] = useState<CheckinTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
