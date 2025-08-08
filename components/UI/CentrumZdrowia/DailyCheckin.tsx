"use client";

import { useState, useEffect } from "react";
import { LuCheck, LuCircle } from "react-icons/lu";
import toast from "react-hot-toast";

type CheckinState = {
  mood?: string;
  sleep?: string;
  energy?: string;
  stress?: string;
  date?: string;
};

const options: Record<keyof Omit<CheckinState, "date">, string[]> = {
  mood: ["😄 Świetne", "🙂 Dobre", "😐 Przeciętne", "😞 Złe"],
  sleep: ["🛌 Dobrze spałem", "😴 Średnio", "😵 Prawie nie spałem"],
  energy: ["⚡️ Wysoka", "🔋 Średnia", "🪫 Niska"],
  stress: ["😌 Niski", "😬 Średni", "😣 Wysoki"],
};

export default function DailyCheckin({
  onCheckinSuccess,
}: {
  onCheckinSuccess?: () => void;
}) {
  const [checkin, setCheckin] = useState<CheckinState>({});
  const [loading, setLoading] = useState(true);
  const [savingField, setSavingField] = useState<keyof CheckinState | null>(
    null
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchCheckin = async () => {
      try {
        const res = await fetch("/api/daily-checkin", { cache: "no-store" });
        if (res.ok) {
          const data: CheckinState | null = await res.json();
          if (data) {
            setCheckin(data);

            const savedDate = new Date(data.date || "");
            const today = new Date();

            const isSameDay =
              savedDate.getFullYear() === today.getFullYear() &&
              savedDate.getMonth() === today.getMonth() &&
              savedDate.getDate() === today.getDate();

            setSaved(isSameDay);
          }
        }
      } catch (err) {
        console.error("Błąd pobierania checkinu", err);
        toast.error("Nie udało się pobrać danych.");
      } finally {
        setLoading(false);
      }
    };

    fetchCheckin();
  }, []);

  const handleSelect = async (
    field: keyof Omit<CheckinState, "date">,
    value: string
  ) => {
    if (checkin[field] === value) return;

    const updated = { ...checkin, [field]: value };
    setCheckin(updated);
    setSavingField(field);

    try {
      const res = await fetch("/api/daily-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (!res.ok) throw new Error("Błąd zapisu checkinu");

      setSaved(true);
      toast.success(`Zapisano: ${labelForField(field)}`);
      onCheckinSuccess?.(); // 🚀 TUTAJ
    } catch (err) {
      toast.error("Nie udało się zapisać danych.");
      console.error(err);
    } finally {
      setSavingField(null);
    }
  };

  const labelForField = (key: keyof CheckinState) => {
    switch (key) {
      case "mood":
        return "Samopoczucie";
      case "sleep":
        return "Jakość snu";
      case "energy":
        return "Poziom energii";
      case "stress":
        return "Poziom stresu";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <div className="bg-white/30 shadow-lg rounded-2xl p-6">
        <p className="text-gray-500 text-sm">
          ⏳ Ładowanie dzisiejszego check-inu...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/30 shadow rounded-2xl p-6 flex flex-col gap-6">
      <h2 className="text-xl font-semibold">📝 Dzisiejszy check-in</h2>

      {Object.entries(options).map(([key, values]) => (
        <div key={key} className="flex flex-col gap-2">
          <span className="font-medium capitalize">
            {key === "mood" && "🧠 Samopoczucie"}
            {key === "sleep" && "🌙 Jakość snu"}
            {key === "energy" && "🔋 Poziom energii"}
            {key === "stress" && "😖 Poziom stresu"}
          </span>

          <div className="flex flex-wrap gap-2">
            {values.map((val) => {
              const selected = checkin[key as keyof CheckinState] === val;
              const isSaving = savingField === key;

              return (
                <button
                  key={val}
                  onClick={() =>
                    handleSelect(key as keyof Omit<CheckinState, "date">, val)
                  }
                  disabled={isSaving}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full border transition
                    ${
                      selected
                        ? "bg-blue-100 border-blue-600 text-blue-600"
                        : "bg-gray-50 border-gray-300 text-gray-600"
                    }
                    ${
                      isSaving ? "opacity-50 cursor-wait" : "hover:!bg-blue-50"
                    }`}
                >
                  {selected ? (
                    <LuCheck className="w-4 h-4" />
                  ) : (
                    <LuCircle className="w-4 h-4" />
                  )}
                  <span className="text-sm">
                    {val} {isSaving && selected ? "⏳" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {saved && (
        <p className="text-sm text-green-600 mt-2">
          ✅ Check-in zapisany. Możesz edytować odpowiedzi do końca dnia.
        </p>
      )}
    </div>
  );
}
