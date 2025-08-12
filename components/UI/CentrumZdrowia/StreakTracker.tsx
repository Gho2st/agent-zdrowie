"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Flame, ChevronRight } from "lucide-react";

type StreakData = {
  streakCount: number;
  lastEntryDate: string | null; // "YYYY-MM-DD"
  // opcjonalnie, jeśli kiedyś dodasz w API:
  history?: string[]; // daty "YYYY-MM-DD" z ostatnich dni
};

type Props = {
  /** Jeśli podasz, daty liczymy w tej strefie (np. "Europe/Warsaw"). */
  userTimeZone?: string;
};

const MILESTONES = [7, 14, 30, 60, 100, 200, 365];

// YYYY-MM-DD w lokalnej strefie lub podanej
function todayISOInTZ(tz?: string) {
  try {
    return new Date().toLocaleDateString(
      "sv-SE",
      tz ? { timeZone: tz } : undefined
    );
  } catch {
    // fallback gdy przeglądarka nie wspiera danej strefy
    return new Date().toISOString().slice(0, 10);
  }
}

// Zwraca tablicę ostatnich 7 dni (YYYY-MM-DD) w zadanej strefie
function lastNDaysISO(n: number, tz?: string) {
  const out: string[] = [];
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

export default function StreakTrackerDynamic({ userTimeZone }: Props) {
  const [data, setData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  // fetch
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

  // oś 7 dni (jeśli brak history – sprytny fallback z samego streakCount)
  const last7 = useMemo(() => {
    const days = lastNDaysISO(7, userTimeZone);
    const set = new Set<string>(data?.history ?? []);
    if (!data?.history && data?.streakCount) {
      for (let i = 0; i < Math.min(7, data.streakCount); i++) {
        const idx = days.length - 1 - i;
        if (idx >= 0) set.add(days[idx]);
      }
      if (data?.lastEntryDate) set.add(data.lastEntryDate);
    }
    return days.map((iso) => ({
      iso,
      done: set.has(iso),
      label: new Date(iso).toLocaleDateString("pl-PL", {
        day: "2-digit",
        month: "2-digit",
      }),
    }));
  }, [data, userTimeZone]);

  // progres do kolejnego progu
  const { nextMilestone, progressPct } = useMemo(() => {
    if (!data) return { nextMilestone: null as number | null, progressPct: 0 };
    const next =
      MILESTONES.find((m) => m > data.streakCount) ?? data.streakCount;
    const prev = MILESTONES.filter((m) => m < next).pop() ?? 0;
    const span = Math.max(1, next - prev);
    const pct = Math.min(
      100,
      Math.round(((data.streakCount - prev) / span) * 100)
    );
    return { nextMilestone: next, progressPct: pct };
  }, [data]);

  return (
    <div className="bg-white/30 shadow rounded-2xl p-4 md:p-5 text-center flex flex-col items-center gap-5">
      <style>{`
        @keyframes glow { 0%,100%{filter:drop-shadow(0 0 0px rgba(249,115,22,0))} 50%{filter:drop-shadow(0 0 10px rgba(249,115,22,0.7))} }
        .flame-glow { animation: glow 2.2s ease-in-out infinite; }
      `}</style>

      <h2 className="text-xl md:text-2xl font-semibold mb-1 flex items-center justify-center gap-2">
        <Flame
          className={`w-6 h-6 ${
            isStreakActive ? "text-orange-500 flame-glow" : "text-gray-400"
          }`}
        />
        Seria dni z pomiarami
      </h2>

      {loading ? (
        <div className="flex flex-col items-center justify-center text-gray-500 py-6">
          <Loader2 className="animate-spin w-5 h-5 mb-2" />
          Ładowanie danych...
          <div className="mt-3 h-3 w-56 bg-gray-200/60 rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-gray-300 animate-pulse" />
          </div>
        </div>
      ) : !data ? (
        <p className="text-gray-500">Brak danych do wyświetlenia.</p>
      ) : (
        <>
          <p className="text-3xl md:text-4xl font-extrabold">
            <span
              className={isStreakActive ? "text-orange-600" : "text-gray-800"}
            >
              {data.streakCount}
            </span>{" "}
            dni
          </p>

          <p className="text-base md:text-lg text-gray-600 -mt-1">
            {isStreakActive
              ? "Dzisiaj już dodałeś pomiar 💪"
              : "Nie zapomnij dodać pomiaru dzisiaj!"}
          </p>

          {/* Oś ostatnich 7 dni */}
          <div className="flex items-center gap-2" aria-label="Ostatnie 7 dni">
            {last7.map(({ iso, done, label }) => (
              <div key={iso} className="flex flex-col items-center">
                <div
                  className={`h-3.5 w-3.5 rounded-full shadow-2xl border-3 transition
                    ${
                      done
                        ? "bg-green-500 border-green-600"
                        : "bg-gray-200 border-gray-300"
                    }`}
                  title={`${label} • ${done ? "jest wpis ✅" : "brak ❌"}`}
                  aria-label={`${label}: ${done ? "zapisano" : "brak"}`}
                />
              </div>
            ))}
          </div>

          {/* Progres do kolejnego progu */}
          {nextMilestone && nextMilestone > 0 && (
            <div className="w-full max-w-md text-left">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">
                  Postęp do kolejnego progu
                </span>
                <span className="text-sm font-medium">{progressPct}%</span>
              </div>
              <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-[width] duration-700 ease-out"
                  style={{ width: `${progressPct}%` }}
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progressPct}
                />
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Cel: {nextMilestone} dni
              </div>
            </div>
          )}

          {/* Odznaka przy wielokrotnościach (7/14/30...) */}
          {MILESTONES.includes(data.streakCount) && data.streakCount > 0 && (
            <div className="mt-1 bg-yellow-100 text-yellow-900 px-3 py-2 rounded-lg font-medium">
              🏅 Gratulacje! Odznaka za {data.streakCount} dni!
            </div>
          )}

          {/* CTA */}
          {!isStreakActive && (
            <button
              onClick={() => (window.location.href = "/pomiary")}
              className="group mt-1 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 active:scale-[0.99] transition"
            >
              Dodaj dzisiejszy pomiar
              <ChevronRight className="w-4 h-4 transition -translate-x-0 group-hover:translate-x-0.5" />
            </button>
          )}
        </>
      )}
    </div>
  );
}
