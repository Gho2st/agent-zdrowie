import { useEffect, useState } from "react";

type StreakData = {
  streakCount: number;
  lastEntryDate: string | null;
};

export default function StreakTrackerDynamic() {
  const [data, setData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStreak = async () => {
      try {
        const res = await fetch("/api/streak");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Błąd ładowania danych:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStreak();
  }, []);

  if (loading) return <div>Ładowanie...</div>;
  if (!data) return <div>Brak danych</div>;

  const today = new Date().toISOString().slice(0, 10);
  const isStreakActive = data.lastEntryDate === today;

  return (
    <div className="bg-white shadow rounded-2xl p-4 my-6 text-center">
      <h2 className="text-xl font-semibold mb-2">🔥 Seria dni z pomiarami</h2>
      <p className="text-3xl font-bold text-green-600">
        {data.streakCount} dni
      </p>
      {isStreakActive ? (
        <p className="text-sm text-gray-500 mt-1">
          Dzisiaj już dodałeś pomiar 💪
        </p>
      ) : (
        <p className="text-sm text-gray-500 mt-1">
          Nie zapomnij dodać pomiaru dzisiaj!
        </p>
      )}
      {data.streakCount > 0 && data.streakCount % 7 === 0 && (
        <div className="mt-4 bg-yellow-100 p-2 rounded-lg font-medium">
          🏅 Gratulacje! Zdobyłeś odznakę za {data.streakCount} dni ciągłości!
        </div>
      )}
    </div>
  );
}
