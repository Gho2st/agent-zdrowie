"use client";

import { Info, AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";

export default function BMICompact({ bmi }) {
  if (bmi === undefined || bmi === null || isNaN(bmi)) return null;

  const minScale = 15;
  const maxScale = 40;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const bmiClamped = clamp(bmi, minScale, maxScale);
  const positionPct = ((bmiClamped - minScale) / (maxScale - minScale)) * 100;

  // Definicje zakresów
  const ranges = [
    {
      label: "Niedowaga",
      from: minScale,
      to: 18.5,
      color: "text-sky-600",
      bg: "bg-sky-400",
      lightBg: "bg-sky-50",
      border: "border-sky-200",
    },
    {
      label: "Prawidłowe",
      from: 18.5,
      to: 25,
      color: "text-emerald-600",
      bg: "bg-emerald-400",
      lightBg: "bg-emerald-50",
      border: "border-emerald-200",
    },
    {
      label: "Nadwaga",
      from: 25,
      to: 30,
      color: "text-amber-500",
      bg: "bg-amber-400",
      lightBg: "bg-amber-50",
      border: "border-amber-200",
    },
    {
      label: "Otyłość",
      from: 30,
      to: maxScale,
      color: "text-rose-500",
      bg: "bg-rose-500",
      lightBg: "bg-rose-50",
      border: "border-rose-200",
    },
  ];

  const currentRange =
    ranges.find((r) => bmi < r.to) || ranges[ranges.length - 1];

  // Punkty graniczne na osi
  const ticks = [18.5, 25, 30];

  const getAdvice = () => {
    if (bmi < 18.5)
      return { icon: Info, text: "Niedowaga. Rozważ konsultację dietetyczną." };
    if (bmi < 25)
      return { icon: CheckCircle, text: "Waga w normie. Świetna robota!" };
    if (bmi < 30)
      return {
        icon: AlertCircle,
        text: "Nadwaga. Małe zmiany w diecie pomogą.",
      };
    return {
      icon: AlertTriangle,
      text: "Otyłość. Zalecana konsultacja z lekarzem.",
    };
  };

  const advice = getAdvice();
  const AdviceIcon = advice.icon;

  return (
    <div
      className={`mt-4 w-full rounded-2xl border p-5 space-y-6 transition-all duration-500 ${currentRange.lightBg} ${currentRange.border}`}
    >
      {/* Nagłówek */}
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">
            Twoje BMI
          </div>
          <div
            className={`text-xl font-black ${currentRange.color} transition-colors duration-500`}
          >
            {currentRange.label}
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span
            className={`text-3xl font-black ${currentRange.color} transition-colors duration-500`}
          >
            {bmi.toFixed(1)}
          </span>
          <span className="text-sm text-gray-400 font-medium">kg/m²</span>
        </div>
      </div>

      {/* Wykres Paskowy */}
      <div className="relative pb-6">
        {/* Tło paska */}
        <div className="flex w-full h-4 rounded-full overflow-hidden shadow-inner bg-gray-200 relative z-0">
          {ranges.map((r) => (
            <div
              key={r.label}
              className={`${r.bg} h-full relative first:rounded-l-full last:rounded-r-full`}
              style={{
                width: `${((r.to - r.from) / (maxScale - minScale)) * 100}%`,
              }}
            />
          ))}
        </div>

        {/* Liczby na osi (Ticks) */}
        {ticks.map((t) => {
          const leftPos = ((t - minScale) / (maxScale - minScale)) * 100;
          return (
            <div
              key={t}
              className="absolute top-4 flex flex-col items-center -translate-x-1/2"
              style={{ left: `${leftPos}%` }}
            >
              <div className="h-1.5 w-px bg-gray-300 mb-0.5"></div>
              <span className="text-[10px] font-bold text-gray-400">{t}</span>
            </div>
          );
        })}

        {/* Marker (Pin) */}
        <div
          className="absolute top-[-6px] -translate-x-1/2 transition-all duration-700 ease-out z-20 drop-shadow-md"
          style={{ left: `${positionPct}%` }}
        >
          <div
            className={`
              w-7 h-7 rounded-full border-[3px] border-white 
              ${currentRange.bg} flex items-center justify-center
            `}
          >
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
        </div>
      </div>

      {/* Alert / Porada */}
      <div
        className={`flex gap-3 items-center p-3 rounded-xl bg-white/70 border ${currentRange.border} shadow-sm backdrop-blur-sm`}
      >
        <div
          className={`p-2 rounded-full bg-white shrink-0 ${currentRange.color} shadow-sm`}
        >
          <AdviceIcon className="w-5 h-5" />
        </div>
        <p className="text-xs text-gray-700 leading-snug font-medium">
          {advice.text}
        </p>
      </div>
    </div>
  );
}
