"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  Info,
  Activity,
  Scale,
  Heart,
  Droplets,
  History,
  CalendarClock,
} from "lucide-react";

const TYPE_CONFIG = {
  BLOOD_PRESSURE: {
    label: "Ciśnienie",
    icon: Activity,
    colorClass: "bg-indigo-50 text-indigo-600",
    textClass: "text-indigo-700",
  },
  GLUCOSE: {
    label: "Glukoza",
    icon: Droplets,
    colorClass: "bg-amber-50 text-amber-600",
    textClass: "text-amber-700",
  },
  WEIGHT: {
    label: "Masa ciała",
    icon: Scale,
    colorClass: "bg-teal-50 text-teal-600",
    textClass: "text-teal-700",
  },
  HEART_RATE: {
    label: "Tętno",
    icon: Heart,
    colorClass: "bg-rose-50 text-rose-600",
    textClass: "text-rose-700",
  },
  DEFAULT: {
    label: "Pomiar",
    icon: Activity,
    colorClass: "bg-gray-50 text-gray-600",
    textClass: "text-gray-700",
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
      <div className="bg-white border border-gray-200 p-6 rounded-3xl min-h-[200px] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-gray-600 mb-3" size={32} />
        <span className="text-sm font-medium text-gray-500">
          Pobieranie historii...
        </span>
      </div>
    );
  }

  if (dane.length === 0) {
    return (
      <div className="bg-white border border-gray-200 p-6 rounded-3xl flex flex-col items-center justify-center text-center gap-4">
        <div className="p-4 bg-gray-100 rounded-full">
          <Info className="w-8 h-8 text-gray-400" />
        </div>
        <div>
          <p className="text-lg font-bold text-gray-700">Pusto w historii</p>
          <p className="text-sm text-gray-500 max-w-[200px] mx-auto leading-snug">
            Dodaj swój pierwszy pomiar, aby zobaczyć go tutaj.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 p-6 rounded-3xl flex flex-col h-full">
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-200">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
          <History className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Historia
          </p>
          <p className="text-xl font-bold text-gray-800 leading-none">
            Ostatnie wyniki
          </p>
        </div>
      </div>

      <ul className="space-y-3 flex-1 overflow-y-auto">
        {dane.map((pomiar) => {
          const config = TYPE_CONFIG[pomiar.type] || TYPE_CONFIG.DEFAULT;
          const Icon = config.icon;

          const dateObj = new Date(pomiar.createdAt);
          const dateStr = dateObj.toLocaleDateString("pl-PL", {
            day: "numeric",
            month: "short",
          });
          const timeStr = dateObj.toLocaleTimeString("pl-PL", {
            hour: "2-digit",
            minute: "2-digit",
          });

          let valueDisplay = "";
          if (pomiar.type === "BLOOD_PRESSURE") {
            valueDisplay = `${pomiar.value}/${pomiar.value2 ?? "?"}`;
          } else {
            valueDisplay = pomiar.value;
          }

          return (
            <li
              key={pomiar.id}
              className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-200"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-2xl shrink-0 ${config.colorClass}`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex flex-col">
                  <span className="font-bold text-gray-700 text-sm">
                    {config.label}
                  </span>
                  <div className="flex items-center text-xs text-gray-500 mt-0.5 gap-1">
                    <CalendarClock className="w-3 h-3" />
                    <span>{dateStr}</span>
                    <span className="text-gray-400">•</span>
                    <span>{timeStr}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span
                  className={`block font-bold text-lg leading-none ${config.textClass}`}
                >
                  {valueDisplay}
                </span>
                <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mt-1 block">
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
