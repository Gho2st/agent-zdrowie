"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  Target,
  CheckCircle2,
  AlertCircle,
  Scale,
  Activity,
  Droplets,
  Heart,
  Minus,
} from "lucide-react";

const GoalItem = ({
  label,
  value,
  min,
  max,
  unit,
  icon: Icon,
  colorClass,
  iconColor,
}) => {
  const hasValue = value !== null && value !== undefined;

  return (
    <div className="group flex items-center justify-between p-3 rounded-2xl hover:bg-white/50 transition-colors border border-transparent hover:border-white/60">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-2xl ${colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>

        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">
            {label}
          </p>
          <p className="text-xs text-gray-500 font-medium">
            Cel:{" "}
            <span className="text-gray-700">
              {min} – {max}
            </span>{" "}
            {unit}
          </p>
        </div>
      </div>

      <div className="text-right">
        <p
          className={`text-lg font-bold leading-none ${
            hasValue ? "text-gray-800" : "text-gray-300"
          }`}
        >
          {hasValue ? value : "---"}
          {hasValue && (
            <span className="text-xs text-gray-400 font-normal ml-1">
              {unit}
            </span>
          )}
        </p>

        <div className="flex justify-end mt-1">
          {hasValue ? null : (
            <div className="flex items-center text-xs text-gray-400">
              <Minus className="w-3 h-3 mr-1" /> Brak danych
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const GoalRow = ({
  label,
  currentVal,
  min,
  max,
  unit,
  icon: Icon,
  colorTheme,
}) => {
  const themes = {
    teal: {
      bg: "bg-teal-50",
      text: "text-teal-600",
      border: "border-teal-100",
    },
    indigo: {
      bg: "bg-indigo-50",
      text: "text-indigo-600",
      border: "border-indigo-100",
    },
    amber: {
      bg: "bg-amber-50",
      text: "text-amber-600",
      border: "border-amber-100",
    },
    rose: {
      bg: "bg-rose-50",
      text: "text-rose-600",
      border: "border-rose-100",
    },
  };
  const theme = themes[colorTheme] || themes.teal;

  let isSuccess = false;
  let displayValue = "---";
  let hasData = false;

  if (
    typeof currentVal === "object" &&
    currentVal !== null &&
    "sys" in currentVal
  ) {
    hasData = true;
    displayValue = `${currentVal.sys}/${currentVal.dia}`;
    isSuccess =
      currentVal.sys >= min.sys &&
      currentVal.sys <= max.sys &&
      currentVal.dia >= min.dia &&
      currentVal.dia <= max.dia;
  } else if (currentVal !== null && currentVal !== undefined) {
    hasData = true;
    displayValue = currentVal;
    isSuccess = currentVal >= min && currentVal <= max;
  }

  return (
    <div className="flex items-center justify-between p-3 mb-2 rounded-2xl hover:bg-white/40 border border-transparent hover:border-white/60 transition-all">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-2xl ${theme.bg} ${theme.text}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-700">{label}</p>
          <p className="text-xs text-gray-500">
            Cel:{" "}
            {typeof min === "object"
              ? `${min.sys}-${max.sys}`
              : `${min}–${max}`}{" "}
            <span className="opacity-70">{unit}</span>
          </p>
        </div>
      </div>

      <div className="text-right">
        <div className="flex items-center justify-end gap-2">
          <span
            className={`text-lg font-bold ${
              hasData ? "text-gray-800" : "text-gray-300"
            }`}
          >
            {displayValue}
          </span>
          {hasData &&
            (isSuccess ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-500" />
            ))}
        </div>
        {hasData && !isSuccess && (
          <p className="text-[10px] font-semibold text-amber-600">Poza celem</p>
        )}
        {hasData && isSuccess && (
          <p className="text-[10px] font-semibold text-emerald-600">W normie</p>
        )}
        {!hasData && <p className="text-[10px] text-gray-400">Brak pomiaru</p>}
      </div>
    </div>
  );
};

export default function CeleZdrowotne() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCele = async () => {
      try {
        const res = await fetch("/api/cele-zdrowotne");
        const json = await res.json();
        if (!json.error) setData(json);
      } catch (err) {
        console.error("Błąd ładowania celów:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCele();
  }, []);

  if (loading)
    return (
      <div className="bg-white/80 backdrop-blur-xl border border-white/40 p-6 rounded-3xl shadow-xl shadow-slate-200/50 h-full min-h-[300px] flex items-center justify-center text-blue-600">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );

  if (!data) return null;

  const { user, values } = data;

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/40 p-6 rounded-3xl shadow-xl shadow-slate-200/50 h-full flex flex-col">
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
        <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
          <Target className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Status
          </p>
          <p className="text-xl font-bold text-gray-800 leading-none">
            Cele zdrowotne
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto pr-1 custom-scrollbar">
        <GoalRow
          label="Masa ciała"
          icon={Scale}
          currentVal={values.weight}
          min={user.weightMin}
          max={user.weightMax}
          unit="kg"
          colorTheme="teal"
        />

        <GoalRow
          label="Ciśnienie"
          icon={Activity}
          currentVal={
            values.systolic && values.diastolic
              ? { sys: values.systolic, dia: values.diastolic }
              : null
          }
          min={{ sys: user.systolicMin, dia: user.diastolicMin }}
          max={{ sys: user.systolicMax, dia: user.diastolicMax }}
          unit="mmHg"
          colorTheme="indigo"
        />

        <GoalRow
          label="Glukoza (czczo)"
          icon={Droplets}
          currentVal={values.glucose}
          min={user.glucoseFastingMin}
          max={user.glucoseFastingMax}
          unit="mg/dL"
          colorTheme="amber"
        />

        <GoalRow
          label="Tętno"
          icon={Heart}
          currentVal={values.pulse}
          min={user.pulseMin}
          max={user.pulseMax}
          unit="bpm"
          colorTheme="rose"
        />
      </div>
    </div>
  );
}
