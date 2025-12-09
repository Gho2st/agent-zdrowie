"use client";

import { useState, useEffect } from "react";
import { LuCheck, LuCircle } from "react-icons/lu";
import toast from "react-hot-toast";

// ZMIANA: Struktura obiektów mapująca Wartość (dla bazy) <-> Etykieta (dla oczu)
// Wartości liczbowe muszą zgadzać się z tym, co przyjmuje Twoja baza (Int)
const OPTIONS_MAP = {
  mood: [
    { value: 4, label: "😄 Świetne" },
    { value: 3, label: "🙂 Dobre" },
    { value: 2, label: "😐 Przeciętne" },
    { value: 1, label: "😞 Złe" },
  ],
  sleep: [
    { value: 3, label: "🛌 Dobrze spałem" },
    { value: 2, label: "😴 Średnio" },
    { value: 1, label: "😵 Prawie nie spałem" },
  ],
  energy: [
    { value: 3, label: "⚡️ Wysoka" },
    { value: 2, label: "🔋 Średnia" },
    { value: 1, label: "🪫 Niska" },
  ],
  stress: [
    { value: 1, label: "😌 Niski" },
    { value: 2, label: "😬 Średni" },
    { value: 3, label: "😣 Wysoki" },
  ],
};

export default function DailyCheckin({ onCheckinSuccess }) {
  const [checkin, setCheckin] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingField, setSavingField] = useState(null);
  const [saved, setSaved] = useState(false);

  // Pobieranie danych check-inu z API
  useEffect(() => {
    const fetchCheckin = async () => {
      try {
        const res = await fetch("/api/daily-checkin", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          // Backend zwraca liczby (np. mood: 3), więc state ustawi się poprawnie
          if (data) {
            setCheckin(data);

            // Sprawdzenie czy wpis jest z dzisiaj
            const savedDate = new Date(data.date || Date.now());
            const today = new Date();
            const isSameDay =
              savedDate.getDate() === today.getDate() &&
              savedDate.getMonth() === today.getMonth() &&
              savedDate.getFullYear() === today.getFullYear();

            setSaved(isSameDay);
          }
        }
      } catch (err) {
        console.error("Błąd pobierania checkinu", err);
        // Nie blokujemy UI tostem błędu przy pierwszym ładowaniu,
        // bo user może po prostu nie mieć jeszcze wpisu
      } finally {
        setLoading(false);
      }
    };

    fetchCheckin();
  }, []);

  // Obsługa wyboru opcji i zapisu danych
  const handleSelect = async (field, value) => {
    // Sprawdzamy, czy wartość się zmieniła (porównujemy liczby)
    if (checkin[field] === value) return;

    // Aktualizujemy stan lokalnie (optymistycznie)
    const updated = { ...checkin, [field]: value };
    setCheckin(updated);
    setSavingField(field);

    try {
      // Wysyłamy do API obiekt z liczbami, np. { mood: 3, energy: 2 }
      const res = await fetch("/api/daily-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (!res.ok) {
        // Jeśli serwer zwróci błąd, spróbujmy odczytać komunikat
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Błąd zapisu checkinu");
      }

      setSaved(true);
      toast.success(`Zapisano: ${labelForField(field)}`);
      onCheckinSuccess?.();
    } catch (err) {
      toast.error("Nie udało się zapisać danych.");
      console.error(err);
      // Opcjonalnie: Cofnij zmianę w UI w przypadku błędu
    } finally {
      setSavingField(null);
    }
  };

  const labelForField = (key) => {
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
        <p className="text-gray-500 text-sm animate-pulse">
          ⏳ Ładowanie dzisiejszego check-inu...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/30 shadow rounded-2xl p-6 flex flex-col gap-6">
      <h2 className="text-xl font-semibold">📝 Dzisiejszy check-in</h2>

      {Object.entries(OPTIONS_MAP).map(([categoryKey, optionsList]) => (
        <div key={categoryKey} className="flex flex-col gap-2">
          <span className="font-medium capitalize flex items-center gap-2 text-gray-700">
            {categoryKey === "mood" && "🧠 Samopoczucie"}
            {categoryKey === "sleep" && "🌙 Jakość snu"}
            {categoryKey === "energy" && "🔋 Poziom energii"}
            {categoryKey === "stress" && "😖 Poziom stresu"}
          </span>

          <div className="flex flex-wrap gap-2">
            {optionsList.map((option) => {
              // Porównujemy wartość liczbową ze state'u z wartością opcji
              const isSelected = checkin[categoryKey] === option.value;
              const isSaving = savingField === categoryKey;

              return (
                <button
                  key={option.value}
                  // Przekazujemy wartość liczbową (option.value)
                  onClick={() => handleSelect(categoryKey, option.value)}
                  disabled={isSaving}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-all duration-200
                    ${
                      isSelected
                        ? "bg-blue-100 border-blue-500 text-blue-700 font-medium ring-1 ring-blue-300"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                    }
                    ${isSaving ? "opacity-50 cursor-wait" : ""}`}
                >
                  {isSelected ? (
                    <LuCheck className="w-4 h-4" />
                  ) : (
                    <LuCircle className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-sm">
                    {option.label} {isSaving && isSelected ? "..." : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {saved && (
        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
          <LuCheck className="w-5 h-5" />
          <span>Dane zapisane. Możesz je edytować do końca dnia.</span>
        </div>
      )}
    </div>
  );
}
