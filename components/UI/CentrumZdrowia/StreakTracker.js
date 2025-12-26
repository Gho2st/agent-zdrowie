"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Flame, Trophy, CalendarCheck, Check } from "lucide-react";

const MILESTONES = [7, 14, 30, 60, 100, 200, 365];

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

  const last7 = useMemo(() => {
    const days = lastNDaysISO(7, userTimeZone);
    const set = new Set(data?.history ?? []);

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
        dayName: dateObj
          .toLocaleDateString("pl-PL", { weekday: "short" })
          .replace(".", ""),
        dayNum: dateObj.getDate(),
      };
    });
  }, [data, userTimeZone]);

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

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 p-6 rounded-3xl min-h-[250px] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-gray-600 mb-3" size={32} />
        <span className="text-sm font-medium text-gray-500">
          Ładowanie serii...
        </span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white border border-gray-200 p-6 rounded-3xl flex flex-col h-full">
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-200">
        <div
          className={`p-3 rounded-2xl ${
            isStreakActive
              ? "bg-orange-100 text-orange-600"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          <Flame className="w-6 h-6" />
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

      <div className="flex flex-col items-center justify-center flex-1 space-y-6">
        <div className="text-center">
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

        {/* Ostatnie 7 dni – bez skalowania */}
        <div className="flex justify-center gap-3 w-full">
          {last7.map(({ iso, done, dayName }) => (
            <div key={iso} className="flex flex-col items-center gap-1">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                  ${
                    done
                      ? "bg-emerald-500 text-white"
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
                  done ? "text-emerald-600" : "text-gray-500"
                }`}
              >
                {dayName}
              </span>
            </div>
          ))}
        </div>

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

            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-amber-500 rounded-full"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {!isStreakActive && (
          <button
            onClick={() => (window.location.href = "/pomiary")}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-white font-semibold"
          >
            <CalendarCheck className="w-5 h-5" />
            Zapisz dzisiejszy wynik
          </button>
        )}
      </div>
    </div>
  );
}
