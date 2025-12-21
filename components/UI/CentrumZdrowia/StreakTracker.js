"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Flame,
  ChevronRight,
  Trophy,
  CalendarCheck,
  Check,
} from "lucide-react";

const MILESTONES = [7, 14, 30, 60, 100, 200, 365];

// Zwraca dzisiejszą datę w formacie YYYY-MM-DD w lokalnej lub podanej strefie
function todayISOInTZ(tz) {
  try {
    return new Date().toLocaleDateString(
      "sv-SE",
      tz ? { timeZone: tz } : undefined
    );
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

// Zwraca tablicę ostatnich 7 dni w formacie YYYY-MM-DD
function lastNDaysISO(n, tz) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(
      tz
        ? d.toLocaleDateString("sv-SE", { timeZone: tz })
        : d.toLocaleDateString("sv-SE")
    );
  }
  return out;
}

export default function StreakTrackerDynamic({ userTimeZone }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Pobieranie danych serii z API
  useEffect(() => {
    const fetchStreak = async () => {
      try {
        const res = await fetch("/api/streak", { cache: "no-store" });
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

  const today = useMemo(() => todayISOInTZ(userTimeZone), [userTimeZone]);
  const isStreakActive = data?.lastEntryDate === today;

  // Przygotowanie osi ostatnich 7 dni
  const last7 = useMemo(() => {
    const days = lastNDaysISO(7, userTimeZone);
    const set = new Set(data?.history ?? []);

    // Logika fallbackowa jeśli brak historii w API (symulacja na podstawie licznika)
    if (!data?.history && data?.streakCount) {
      for (let i = 0; i < Math.min(7, data.streakCount); i++) {
        const idx = days.length - 1 - i;
        if (idx >= 0) set.add(days[idx]);
      }
      if (data?.lastEntryDate) set.add(data.lastEntryDate);
    }

    return days.map((iso) => {
      const dateObj = new Date(iso);
      return {
        iso,
        done: set.has(iso),
        // Skrócona nazwa dnia tygodnia (np. Pn, Wt)
        dayName: dateObj
          .toLocaleDateString("pl-PL", { weekday: "short" })
          .replace(".", ""),
        dayNum: dateObj.getDate(),
      };
    });
  }, [data, userTimeZone]);

  // Obliczenie postępu do kolejnego progu
  const { nextMilestone, progressPct } = useMemo(() => {
    if (!data) return { nextMilestone: null, progressPct: 0 };
    const next =
      MILESTONES.find((m) => m > data.streakCount) ?? data.streakCount + 100;
    const prev = MILESTONES.filter((m) => m < next).pop() ?? 0;
    const span = Math.max(1, next - prev);
    const currentProgress = Math.max(0, data.streakCount - prev);
    const pct = Math.min(100, Math.round((currentProgress / span) * 100));
    return { nextMilestone: next, progressPct: pct };
  }, [data]);

  // Wspólny styl kontenera
  const containerClasses =
    "bg-white/80 backdrop-blur-xl border border-white/40 p-6 rounded-3xl shadow-xl shadow-slate-200/50 flex flex-col h-full";

  if (loading) {
    return (
      <div
        className={`${containerClasses} items-center justify-center min-h-[250px]`}
      >
        <Loader2 className="animate-spin text-orange-500 mb-3" size={32} />
        <span className="text-sm font-medium text-gray-400">
          Ładowanie serii...
        </span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className={containerClasses}>
      {/* NAGŁÓWEK */}
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
        <div
          className={`p-3 rounded-2xl ${
            isStreakActive
              ? "bg-orange-100 text-orange-600"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          <Flame
            className={`w-6 h-6 ${isStreakActive ? "animate-pulse" : ""}`}
          />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Regularność
          </p>
          <h2 className="text-xl font-bold text-gray-800 leading-none">
            Twoja Seria
          </h2>
        </div>
      </div>

      {/* GŁÓWNA TREŚĆ */}
      <div className="flex flex-col items-center justify-center flex-1 space-y-6">
        {/* Licznik dni */}
        <div className="text-center relative">
          <div className="text-6xl font-black text-gray-800 tracking-tight leading-none">
            {data.streakCount}
            <span className="text-base font-medium text-gray-400 ml-2 align-middle">
              dni
            </span>
          </div>

          <p
            className={`text-sm font-semibold mt-2 ${
              isStreakActive ? "text-emerald-600" : "text-amber-600"
            }`}
          >
            {isStreakActive
              ? "🔥 Seria podtrzymana! Świetna robota."
              : "⚠️ Nie przerywaj serii! Dodaj wpis dziś."}
          </p>
        </div>

        {/* Historia 7 dni */}
        <div className="flex justify-center gap-2 md:gap-3 w-full">
          {last7.map(({ iso, done, dayName }) => (
            <div key={iso} className="flex flex-col items-center gap-1">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                  ${
                    done
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-200 scale-105"
                      : "bg-gray-100 text-gray-300 border border-gray-200"
                  }
                `}
                title={iso}
              >
                {done ? (
                  <Check className="w-4 h-4" strokeWidth={3} />
                ) : (
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                )}
              </div>
              <span
                className={`text-[10px] font-medium uppercase ${
                  done ? "text-emerald-600" : "text-gray-400"
                }`}
              >
                {dayName}
              </span>
            </div>
          ))}
        </div>

        {/* Pasek postępu do milestone */}
        {nextMilestone && (
          <div className="w-full">
            <div className="flex justify-between items-end mb-2 px-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wide">
                <Trophy className="w-3.5 h-3.5 text-orange-400" />
                Cel: {nextMilestone} dni
              </div>
              <span className="text-xs font-bold text-orange-600">
                {progressPct}%
              </span>
            </div>

            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-100">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-amber-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(251,146,60,0.4)]"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Przycisk akcji (tylko gdy seria nieaktywna) */}
        {!isStreakActive && (
          <button
            onClick={() => (window.location.href = "/pomiary")}
            className="w-full group mt-2 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-white font-semibold shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:shadow-emerald-300 active:scale-[0.98] transition-all"
          >
            <CalendarCheck className="w-5 h-5" />
            Zapisz dzisiejszy wynik
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        )}
      </div>
    </div>
  );
}
