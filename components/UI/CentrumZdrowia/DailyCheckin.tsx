"use client";

import { useState, useEffect } from "react";
import { LuCheck, LuCircle } from "react-icons/lu";
import toast from "react-hot-toast";

type CheckinState = {
  mood?: string;
  sleep?: string;
  energy?: string;
  stress?: string;
};

const options = {
  mood: ["😄 Świetne", "🙂 Dobre", "😐 Przeciętne", "😞 Złe"],
  sleep: ["🛌 Dobrze spałem", "😴 Średnio", "😵 Prawie nie spałem"],
  energy: ["⚡️ Wysoka", "🔋 Średnia", "🪫 Niska"],
  stress: ["😌 Niski", "😬 Średni", "😣 Wysoki"],
};

export default function DailyCheckin() {
  const [checkin, setCheckin] = useState<CheckinState>({});
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  // ⬇️ Pobierz dzisiejszy check-in z backendu
  useEffect(() => {
    const fetchCheckin = async () => {
      try {
        const res = await fetch("/api/daily-checkin");
        if (res.ok) {
          const data = await res.json();
          setCheckin(data || {});
          setSaved(!!data);
        }
      } catch (err) {
        console.error("Błąd pobierania checkinu", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCheckin();
  }, []);

  const handleSelect = async (field: keyof CheckinState, value: string) => {
    const updated = { ...checkin, [field]: value };
    setCheckin(updated);
    setSaved(false);

    try {
      const res = await fetch("/api/daily-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (!res.ok) throw new Error("Błąd zapisu checkinu");
      setSaved(true);
      toast.success("Zapisano odpowiedź");
    } catch (err) {
      toast.error("Nie udało się zapisać danych");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow-lg rounded-2xl p-6">
        <p className="text-gray-500 text-sm">
          Ładowanie dzisiejszego check-inu...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 flex flex-col gap-6">
      <h2 className="text-xl font-semibold">📝 Dzisiejszy check-in</h2>

      {Object.entries(options).map(([key, values]) => (
        <div key={key} className="flex flex-col gap-2">
          <span className="font-medium">
            {key === "mood" && "🧠 Samopoczucie"}
            {key === "sleep" && "🌙 Jakość snu"}
            {key === "energy" && "🔋 Poziom energii"}
            {key === "stress" && "😖 Poziom stresu"}
          </span>

          <div className="flex flex-wrap gap-2">
            {values.map((val) => {
              const selected = checkin[key as keyof CheckinState] === val;
              return (
                <button
                  key={val}
                  onClick={() => handleSelect(key as keyof CheckinState, val)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full border ${
                    selected
                      ? "bg-blue-100 border-blue-600 text-blue-600"
                      : "bg-gray-50 border-gray-300 text-gray-600"
                  } hover:bg-blue-50 transition`}
                >
                  {selected ? (
                    <LuCheck className="w-4 h-4" />
                  ) : (
                    <LuCircle className="w-4 h-4" />
                  )}
                  <span className="text-sm">{val}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {saved && <p className="text-sm text-green-600 mt-2">✅ Dane zapisane</p>}
    </div>
  );
}
