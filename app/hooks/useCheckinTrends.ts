import { useEffect, useState } from "react";

export type CheckinTrend = {
  date: string; // ISO string
  sleep?: string;
  stress?: string;
  energy?: string;
};

export default function useCheckinTrends() {
  const [trends, setTrends] = useState<CheckinTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const res = await fetch("/api/checkin-trends?days=7", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Błąd pobierania danych");
        const data = await res.json();
        setTrends(data);
      } catch (err) {
        setError("Nie udało się pobrać trendów");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
  }, []);

  return { trends, loading, error };
}
