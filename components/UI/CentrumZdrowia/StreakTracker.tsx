import { useEffect, useState } from "react";
import { Loader2, Flame } from "lucide-react";

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

  const today = new Date().toISOString().slice(0, 10);
  const isStreakActive = data?.lastEntryDate === today;

  return (
    <div className="bg-white/30 shadow rounded-2xl p-4 text-center flex flex-col justify-center items-center gap-6">
      <h2 className="text-xl md:text-2xl font-semibold mb-2 flex items-center justify-center gap-2">
        <Flame className="text-orange-500 w-6 h-6" /> Seria dni z pomiarami
      </h2>

      {loading ? (
        <div className="flex flex-col items-center justify-center text-gray-500 py-6">
          <Loader2 className="animate-spin w-5 h-5 mb-2" />
          Ładowanie danych...
        </div>
      ) : !data ? (
        <p className="text-gray-500">Brak danych do wyświetlenia.</p>
      ) : (
        <>
          <p className="text-2xl xl:text-4xl font-bold text-green-600">
            {data.streakCount} dni
          </p>
          <p className="text-base md:text-lg text-gray-500 mt-1">
            {isStreakActive
              ? "Dzisiaj już dodałeś pomiar 💪"
              : "Nie zapomnij dodać pomiaru dzisiaj!"}
          </p>

          {data.streakCount > 0 && data.streakCount % 7 === 0 && (
            <div className="mt-4 bg-yellow-100 text-yellow-800 p-3 rounded-lg font-medium">
              🏅 Gratulacje! Zdobyłeś odznakę za {data.streakCount} dni
              ciągłości!
            </div>
          )}
        </>
      )}
    </div>
  );
}
