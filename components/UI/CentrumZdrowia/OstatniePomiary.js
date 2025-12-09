"use client";

import { useEffect, useState } from "react";
import { Loader2, Info, Activity, Scale, Heart, Droplets } from "lucide-react";

// Konfiguracja oparta WYŁĄCZNIE na Enumach z Twojej schemy
const TYPE_CONFIG = {
  BLOOD_PRESSURE: {
    label: "Ciśnienie",
    icon: <Heart className="w-5 h-5" />,
    color: "text-rose-600",
    bg: "bg-rose-100",
  },
  GLUCOSE: {
    label: "Glukoza",
    icon: <Droplets className="w-5 h-5" />,
    color: "text-blue-600",
    bg: "bg-blue-100",
  },
  WEIGHT: {
    label: "Waga",
    icon: <Scale className="w-5 h-5" />,
    color: "text-teal-600",
    bg: "bg-teal-100",
  },
  HEART_RATE: {
    label: "Tętno",
    icon: <Activity className="w-5 h-5" />,
    color: "text-amber-600",
    bg: "bg-amber-100",
  },
};

export default function OstatniePomiary() {
  const [dane, setDane] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPomiary = async () => {
      try {
        const res = await fetch("/api/ostatnie-pomiary");
        if (!res.ok) throw new Error("Błąd sieci");

        const data = await res.json();

        // Zakładamy, że API zwraca tablicę zgodną z modelem Measurement
        if (Array.isArray(data)) {
          setDane(data);
        }
      } catch (err) {
        console.error("Błąd ładowania pomiarów:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPomiary();
  }, []);

  if (loading) {
    return (
      <div className="bg-white/40 backdrop-blur-lg border border-white/20 p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center h-[200px] animate-pulse">
        <Loader2 className="animate-spin text-blue-500 mb-2" size={32} />
        <span className="text-gray-500 font-medium">Ładowanie danych...</span>
      </div>
    );
  }

  if (dane.length === 0) {
    return (
      <div className="bg-white/40 backdrop-blur-lg border border-white/20 p-8 rounded-2xl shadow-lg text-center flex flex-col items-center gap-3">
        <div className="bg-gray-100 p-4 rounded-full">
          <Info className="w-8 h-8 text-gray-400" />
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-700">Brak pomiarów</p>
          <p className="text-sm text-gray-500">
            Dodaj swój pierwszy wynik, aby zacząć analizę.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/40 backdrop-blur-lg border border-white/20 p-6 rounded-2xl shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800">📈 Ostatnie wyniki</h3>
        <span className="text-xs bg-white/50 px-2 py-1 rounded-md text-gray-500 border border-gray-200">
          Najnowsze wpisy
        </span>
      </div>

      <ul className="space-y-3">
        {dane.map((pomiar) => {
          // 1. Konfiguracja wyglądu na podstawie Enuma
          const config = TYPE_CONFIG[pomiar.type] || {
            label: pomiar.type,
            icon: <Activity className="w-5 h-5" />,
            color: "text-gray-600",
            bg: "bg-gray-100",
          };

          // 2. Formatowanie daty
          const dateObj = new Date(pomiar.createdAt);
          const dateStr = dateObj.toLocaleDateString("pl-PL", {
            day: "numeric",
            month: "short",
          });
          const timeStr = dateObj.toLocaleTimeString("pl-PL", {
            hour: "2-digit",
            minute: "2-digit",
          });

          // 3. Wyświetlanie wartości zgodnie z nową schemą (value / value2)
          let valueDisplay = "";

          if (pomiar.type === "BLOOD_PRESSURE") {
            // Dla ciśnienia używamy value (skurczowe) i value2 (rozkurczowe)
            // Używamy ?. żeby nie wywaliło błędu jeśli value2 jest null (choć nie powinno)
            valueDisplay = `${pomiar.value}/${pomiar.value2 ?? "?"}`;
          } else {
            // Dla reszty używamy głównego pola value
            valueDisplay = pomiar.value;
          }

          return (
            <li
              key={pomiar.id}
              className="flex items-center justify-between p-3 bg-white/50 hover:bg-white/80 border border-white/40 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {/* LEWA STRONA: Ikona + Nazwa + Data */}
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${config.bg} ${config.color} shrink-0 shadow-sm`}
                >
                  {config.icon}
                </div>

                <div className="flex flex-col">
                  <span className="font-bold text-gray-800 text-sm md:text-base">
                    {config.label}
                  </span>
                  <span className="text-xs text-gray-500">
                    {dateStr}, <span className="text-gray-400">{timeStr}</span>
                  </span>
                </div>
              </div>

              {/* PRAWA STRONA: Wartość + Jednostka */}
              <div className="text-right">
                <span
                  className={`block font-extrabold text-lg leading-tight ${config.color}`}
                >
                  {valueDisplay}
                </span>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">
                  {pomiar.unit}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
