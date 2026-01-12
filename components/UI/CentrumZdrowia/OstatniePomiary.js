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
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

const TYPE_CONFIG = {
  BLOOD_PRESSURE: {
    label: "Ciśnienie",
    icon: Activity,
    colorClass: "bg-indigo-50 text-indigo-600",
  },
  GLUCOSE: {
    label: "Glukoza",
    icon: Droplets,
    colorClass: "bg-amber-50 text-amber-600",
  },
  WEIGHT: {
    label: "Masa ciała",
    icon: Scale,
    colorClass: "bg-teal-50 text-teal-600",
  },
  HEART_RATE: {
    label: "Tętno",
    icon: Heart,
    colorClass: "bg-rose-50 text-rose-600",
  },
  DEFAULT: {
    label: "Pomiar",
    icon: Activity,
    colorClass: "bg-gray-50 text-gray-600",
  },
};

const STATUS_CONFIG = {
  normal: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    icon: CheckCircle2,
    label: "W normie",
  },
  high: {
    bg: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-700",
    icon: AlertTriangle,
    label: "Za wysoko",
  },
  low: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    icon: AlertTriangle,
    label: "Za nisko",
  },
  unknown: {
    bg: "bg-gray-50",
    border: "border-gray-200",
    text: "text-gray-600",
    icon: null,
    label: "Brak norm",
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
          const statusStyle =
            STATUS_CONFIG[pomiar.status] || STATUS_CONFIG.unknown;

          const dateObj = new Date(pomiar.createdAt);
          const dateStr = dateObj.toLocaleDateString("pl-PL", {
            day: "numeric",
            month: "short",
          });
          const timeStr = dateObj.toLocaleTimeString("pl-PL", {
            hour: "2-digit",
            minute: "2-digit",
          });

          const valueDisplay =
            pomiar.type === "BLOOD_PRESSURE"
              ? `${pomiar.value}/${pomiar.value2 ?? "?"}`
              : pomiar.value;

          const StatusIcon = statusStyle.icon;

          return (
            <li
              key={pomiar.id}
              className={`flex items-center justify-between p-3 rounded-2xl ${statusStyle.bg} ${statusStyle.border} border transition-all hover:brightness-105`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-2xl shrink-0 ${config.colorClass}`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex flex-col">
                  <span className="font-bold text-gray-800 text-sm">
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
                <div className="flex items-baseline justify-end gap-2">
                  <span
                    className={`font-bold text-xl leading-none ${statusStyle.text}`}
                  >
                    {valueDisplay}
                  </span>
                  {StatusIcon && (
                    <StatusIcon className={`w-5 h-5 ${statusStyle.text}`} />
                  )}
                </div>

                <div className="text-xs text-gray-600 mt-1">
                  <span className="font-medium uppercase">{pomiar.unit}</span>
                  {pomiar.reference && (
                    <span className="ml-2 opacity-75">
                      norma: {pomiar.reference}
                    </span>
                  )}
                </div>

                <span
                  className={`mt-1 inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle.text} bg-white/60`}
                >
                  {pomiar.statusLabel}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
