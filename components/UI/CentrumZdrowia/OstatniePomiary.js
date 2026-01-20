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
  AlertCircle,
} from "lucide-react";

import { analyzeMeasurement } from "@/app/utils/healthAnalysis";

// Konfiguracja typów pomiarów
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

// Style wizualne wyników analizy
const COLOR_STYLES = {
  green: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    badge: "bg-white/60 text-emerald-700",
    icon: CheckCircle2,
  },
  red: {
    bg: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-700",
    badge: "bg-white/60 text-rose-700",
    icon: AlertTriangle,
  },
  orange: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    badge: "bg-white/60 text-orange-700",
    icon: AlertTriangle,
  },
  blue: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    badge: "bg-white/60 text-blue-700",
    icon: AlertCircle,
  },
  yellow: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    badge: "bg-white/60 text-amber-700",
    icon: AlertCircle,
  },
  gray: {
    bg: "bg-gray-50",
    border: "border-gray-200",
    text: "text-gray-600",
    badge: "bg-white/60 text-gray-600",
    icon: null,
  },
};

// Tłumaczenia statusów
const STATUS_TRANSLATIONS = {
  CRITICAL: "Krytyczny",
  ALARM: "Za wysoko",
  ELEVATED: "Podwyższony",
  HIGH: "Wysoki",
  LOW: "Niski",
  OPTIMAL: "Optymalny",
  IN_RANGE: "W normie",
  OK: "OK",
  IN_TARGET: "W strefie",
  BELOW_TARGET: "Poniżej strefy",
  ABOVE_TARGET: "Powyżej strefy",
  UNKNOWN: "Brak norm",
};

const getValidContext = (rawContext) => {
  if (typeof rawContext !== "string") return null;
  const ctx = rawContext.trim();

  if (["przed posiłkiem", "po posiłku", "podczas treningu"].includes(ctx)) {
    return ctx;
  }

  return null; // wszystko inne → brak kontekstu
};

export default function OstatniePomiary() {
  const [dane, setDane] = useState([]);
  const [norms, setNorms] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [pomiaryRes, normyRes] = await Promise.all([
          fetch("/api/ostatnie-pomiary"),
          fetch("/api/user/norms"),
        ]);

        const pomiaryData = pomiaryRes.ok ? await pomiaryRes.json() : [];
        const normyData = normyRes.ok ? await normyRes.json() : null;

        setDane(Array.isArray(pomiaryData) ? pomiaryData : []);
        setNorms(normyData);
      } catch (err) {
        console.error("Błąd ładowania danych:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 p-6 rounded-3xl min-h-[200px] flex flex-col items-center justify-center h-full">
        <Loader2 className="animate-spin text-gray-600 mb-3" size={32} />
        <span className="text-sm font-medium text-gray-500">
          Pobieranie ostatnich wyników...
        </span>
      </div>
    );
  }

  if (dane.length === 0) {
    return (
      <div className="bg-white border border-gray-200 p-6 rounded-3xl flex flex-col items-center justify-center text-center gap-4 h-full">
        <div className="p-4 bg-gray-100 rounded-full">
          <Info className="w-8 h-8 text-gray-400" />
        </div>
        <div>
          <p className="text-lg font-bold text-gray-700">Brak pomiarów</p>
          <p className="text-sm text-gray-500 max-w-[220px] mx-auto leading-snug">
            Dodaj pierwszy pomiar – pojawi się tutaj od razu.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 p-6 rounded-3xl flex flex-col h-full shadow-sm">
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-200">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
          <History className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Ostatnie
          </p>
          <p className="text-xl font-bold text-gray-800 leading-none">Wyniki</p>
        </div>
      </div>

      <ul className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {dane.map((pomiar) => {
          const config = TYPE_CONFIG[pomiar.type] || TYPE_CONFIG.DEFAULT;
          const Icon = config.icon;

          const valueForAnalysis =
            pomiar.type === "BLOOD_PRESSURE"
              ? { sys: Number(pomiar.value), dia: Number(pomiar.value2 || 0) }
              : Number(pomiar.value);

          const validContext = getValidContext(pomiar.context);

          let analysisContext = {};
          if (pomiar.type === "GLUCOSE" && validContext) {
            analysisContext.timing = validContext;
          } else if (
            pomiar.type === "HEART_RATE" &&
            validContext === "podczas treningu"
          ) {
            analysisContext.context = "podczas treningu";
          } else if (pomiar.type === "HEART_RATE") {
            analysisContext.context = "spoczynkowe"; // domyślny dla tętna
          }

          const analysis = analyzeMeasurement(
            pomiar.type,
            valueForAnalysis,
            norms,
            analysisContext,
          );

          const styles = COLOR_STYLES[analysis.color] || COLOR_STYLES.gray;
          const StatusIcon = styles.icon;
          const statusText =
            STATUS_TRANSLATIONS[analysis.status] || analysis.status || "—";

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
              ? `${pomiar.value || "?"}/${pomiar.value2 || "?"}`
              : pomiar.value;

          return (
            <li
              key={pomiar.id}
              className={`flex items-center justify-between p-3 rounded-2xl ${styles.bg} ${styles.border} border transition-all hover:brightness-[0.98]`}
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
                  <div className="flex items-center text-xs text-gray-500 mt-0.5 gap-1.5 flex-wrap">
                    <div className="flex items-center gap-1 whitespace-nowrap">
                      <CalendarClock className="w-3 h-3" />
                      <span>{dateStr}</span>
                      <span className="text-gray-400">•</span>
                      <span>{timeStr}</span>
                    </div>

                    {validContext && (
                      <span className="px-2 py-0.5 bg-gray-100/80 text-gray-600 text-[10px] rounded-md font-medium border border-gray-200/60">
                        {validContext}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="flex items-baseline justify-end gap-2">
                  <span
                    className={`font-bold text-xl leading-none ${styles.text}`}
                  >
                    {valueDisplay}
                  </span>
                  {StatusIcon && (
                    <StatusIcon className={`w-4 h-4 ${styles.text}`} />
                  )}
                </div>

                <div className="text-xs text-gray-600 mt-1">
                  <span className="font-medium uppercase">
                    {pomiar.unit || "—"}
                  </span>
                </div>

                <span
                  className={`mt-1.5 inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wide ${styles.badge}`}
                >
                  {statusText}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
