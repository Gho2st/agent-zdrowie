"use client";

import { useState, useEffect } from "react";
import {
  ClipboardCheck,
  Check,
  Brain,
  Moon,
  Zap,
  Activity,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

// Konfiguracja kategorii: Ikony, Kolory i Opcje
const CATEGORIES = {
  mood: {
    label: "Samopoczucie",
    icon: Brain,
    theme: {
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
      activeBg: "bg-indigo-100",
      activeBorder: "border-indigo-300",
      activeText: "text-indigo-700",
    },
    options: [
      { value: 4, label: "😄 Świetne" },
      { value: 3, label: "🙂 Dobre" },
      { value: 2, label: "😐 Przeciętne" },
      { value: 1, label: "😞 Złe" },
    ],
  },
  sleep: {
    label: "Jakość snu",
    icon: Moon,
    theme: {
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      activeBg: "bg-blue-100",
      activeBorder: "border-blue-300",
      activeText: "text-blue-700",
    },
    options: [
      { value: 3, label: "🛌 Dobra" },
      { value: 2, label: "😴 Średnia" },
      { value: 1, label: "😵 Zła" },
    ],
  },
  energy: {
    label: "Poziom energii",
    icon: Zap,
    theme: {
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      activeBg: "bg-amber-100",
      activeBorder: "border-amber-300",
      activeText: "text-amber-700",
    },
    options: [
      { value: 3, label: "⚡️ Wysoka" },
      { value: 2, label: "🔋 Średnia" },
      { value: 1, label: "🪫 Niska" },
    ],
  },
  stress: {
    label: "Poziom stresu",
    icon: Activity,
    theme: {
      iconBg: "bg-rose-50",
      iconColor: "text-rose-600",
      activeBg: "bg-rose-100",
      activeBorder: "border-rose-300",
      activeText: "text-rose-700",
    },
    options: [
      { value: 1, label: "😌 Niski" },
      { value: 2, label: "😬 Średni" },
      { value: 3, label: "😣 Wysoki" },
    ],
  },
};

export default function DailyCheckin({ onCheckinSuccess }) {
  const [checkin, setCheckin] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingField, setSavingField] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchCheckin = async () => {
      try {
        const res = await fetch("/api/daily-checkin", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setCheckin(data);
            const savedDate = new Date(data.date || Date.now());
            const today = new Date();
            const isSameDay =
              savedDate.getDate() === today.getDate() &&
              savedDate.getMonth() === today.getMonth() &&
              savedDate.getFullYear() === today.getFullYear();
            setSaved(isSameDay);
          }
        }
      } catch (err) {
        console.error("Błąd pobierania checkinu", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCheckin();
  }, []);

  const handleSelect = async (field, value) => {
    if (checkin[field] === value) return;

    const updated = { ...checkin, [field]: value };
    setCheckin(updated);
    setSavingField(field);

    try {
      const res = await fetch("/api/daily-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Błąd zapisu checkinu");
      }

      setSaved(true);
      toast.success(`Zapisano: ${CATEGORIES[field].label}`);
      onCheckinSuccess?.();
    } catch (err) {
      toast.error("Nie udało się zapisać danych.");
      console.error(err);
    } finally {
      setSavingField(null);
    }
  };

  const containerClasses =
    "bg-white/80 backdrop-blur-xl border border-white/40 p-6 rounded-3xl shadow-xl shadow-slate-200/50 flex flex-col";

  if (loading) {
    return (
      <div
        className={`${containerClasses} items-center justify-center min-h-[400px]`}
      >
        <Loader2 className="animate-spin text-green-600 mb-3" size={32} />
        <span className="text-sm font-medium text-gray-400">
          Ładowanie check-inu...
        </span>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <div className="flex items-center gap-4 mb-8 pb-4 border-b border-gray-100">
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
          <ClipboardCheck className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Codzienny Raport
          </p>
          <p className="text-xl font-bold text-gray-800 leading-none">
            Twój Check-in
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {Object.entries(CATEGORIES).map(([key, config]) => {
          const Icon = config.icon;
          const theme = config.theme;

          return (
            <div key={key}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`w-4 h-4 ${theme.iconColor}`} />
                <span className="text-sm font-bold text-gray-700">
                  {config.label}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {config.options.map((option) => {
                  const isSelected = checkin[key] === option.value;
                  const isSaving = savingField === key;

                  return (
                    <button
                      key={option.value}
                      onClick={() => handleSelect(key, option.value)}
                      disabled={isSaving}
                      className={`
                        relative group flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200
                        ${
                          isSelected
                            ? `${theme.activeBg} ${theme.activeBorder} ${theme.activeText} shadow-sm`
                            : "bg-white/40 border-transparent text-gray-600 hover:bg-white/80 hover:border-white/60 hover:shadow-sm"
                        }
                        ${isSaving ? "opacity-70 cursor-wait" : ""}
                      `}
                    >
                      <span>{option.label}</span>

                      {isSelected && !isSaving && (
                        <Check className="w-4 h-4 ml-1 opacity-100 transition-opacity duration-300" />
                      )}

                      {isSaving && isSelected && (
                        <Loader2 className="w-4 h-4 ml-1 animate-spin" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div
        className={`mt-8 transition-all duration-500 overflow-hidden ${
          saved ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex items-center justify-center gap-2 p-3 bg-emerald-50/80 border border-emerald-100 rounded-2xl text-emerald-700 text-sm font-medium">
          <Check className="w-4 h-4" />
          <span>Check-in zapisany na dziś!</span>
        </div>
      </div>
    </div>
  );
}
