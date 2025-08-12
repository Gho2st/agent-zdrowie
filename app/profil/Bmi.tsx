import React from "react";

export default function BMICompact({ bmi }: { bmi: number }) {
  const minScale = 14;
  const maxScale = 40;

  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));
  const bmiClamped = clamp(bmi, minScale, maxScale);
  const positionPct = ((bmiClamped - minScale) / (maxScale - minScale)) * 100;

  const ranges = [
    { label: "Niedowaga", from: minScale, to: 18.5, bg: "bg-sky-300" },
    { label: "Prawidłowe", from: 18.5, to: 25, bg: "bg-emerald-400" },
    { label: "Nadwaga", from: 25, to: 30, bg: "bg-amber-400" },
    { label: "Otyłość", from: 30, to: maxScale, bg: "bg-rose-500" },
  ];

  const category =
    bmi < 18.5
      ? "Niedowaga"
      : bmi < 25
      ? "Prawidłowe"
      : bmi < 30
      ? "Nadwaga"
      : "Otyłość";

  const ticks = [minScale, 18.5, 25, 30, maxScale];

  return (
    <div className="bg-white/30 mt-6 w-full rounded-2xl border border-gray-200 shadow-2xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">BMI (kg/m²)</div>
          <div className="text-xl font-semibold">{category}</div>
        </div>
        <div className="text-2xl font-bold tracking-tight">
          {bmi.toFixed(1)}
        </div>
      </div>

      {/* Skala: podpisy NAD markerem */}
      <div className="space-y-2">
        <div className="relative">
          <div className="absolute inset-x-0 -top-4 flex justify-between text-[10px] text-gray-500">
            {ticks.map((t, i) => (
              <span key={i} className={i === 0 ? "" : "-translate-x-1/2"}>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Pasek stref */}
        <div className="flex w-full h-4 rounded-xl overflow-hidden ring-1 ring-black/5 mt-4">
          {ranges.map((r) => (
            <div
              key={r.label}
              className={`${r.bg} h-full`}
              style={{
                width: `${((r.to - r.from) / (maxScale - minScale)) * 100}%`,
              }}
              aria-label={`${r.label} ${r.from}–${r.to}`}
              title={`${r.label} ${r.from}–${r.to}`}
            />
          ))}
        </div>

        {/* Marker */}
        <div className="relative h-6">
          <div
            className="absolute -top-2"
            style={{ left: `calc(${positionPct}% - 8px)` }}
          >
            <div className="w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-gray-700" />
            <div className="text-[11px] text-gray-700 text-center font-medium">
              {bmi.toFixed(1)}
            </div>
          </div>
        </div>
      </div>

      {/* Legenda kolorów */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-700">
        {ranges.map((r) => (
          <div key={r.label} className="flex items-center gap-1.5">
            <span
              className={`inline-block w-3 h-3 rounded ${r.bg} ring-1 ring-black/10`}
            />
            <span>{r.label}</span>
          </div>
        ))}
      </div>

      {/* Alert */}
      <div
        className={`p-3 rounded-xl text-sm flex gap-2 ${
          bmi < 18.5
            ? "bg-sky-50 text-sky-700"
            : bmi < 25
            ? "bg-emerald-50 text-emerald-700"
            : bmi < 30
            ? "bg-amber-50 text-amber-700"
            : "bg-rose-50 text-rose-700"
        }`}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          className="mt-0.5"
          aria-hidden
        >
          <path
            d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v5"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="12" cy="17" r="1" fill="currentColor" />
        </svg>
        <p className="leading-snug">
          {bmi < 18.5 && (
            <>Rozważ zwiększenie podaży kalorii i konsultację z dietetykiem.</>
          )}
          {bmi >= 18.5 && bmi < 25 && (
            <>Dobra robota! Utrzymuj aktywność i zbilansowaną dietę.</>
          )}
          {bmi >= 25 && bmi < 30 && (
            <>
              Delikatnie powyżej normy – małe zmiany w ruchu i diecie mogą
              pomóc.
            </>
          )}
          {bmi >= 30 && (
            <>
              Zwiększone ryzyko zdrowotne – przyda się plan żywieniowy i
              konsultacja specjalistyczna.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
