"use client";

import toast from "react-hot-toast";
import { useState } from "react";
import {
  Save,
  X,
  Activity,
  Droplet,
  Gauge,
  HeartPulse,
  Stethoscope,
  Check,
  Plus,
  PlusCircle,
  Pill,
  Dumbbell,
  ClipboardList,
  Loader2,
  ChevronDown,
} from "lucide-react";

const SimpleConditionCard = ({
  label,
  icon: Icon,
  value,
  onChange,
  isRemovable = false,
}) => {
  return (
    <div
      onClick={() => onChange(!value)}
      className={`group relative flex items-center gap-4 p-4 rounded-xl cursor-pointer border transition-all duration-300 ease-in-out ${
        value
          ? "border-emerald-500 bg-emerald-50/80 shadow-md scale-[1.01]"
          : "border-gray-200 bg-white hover:border-emerald-300 hover:shadow-sm hover:bg-gray-50"
      }`}
    >
      <div
        className={`p-2.5 rounded-lg transition-colors duration-300 ${
          value
            ? "bg-emerald-100 text-emerald-600"
            : "bg-gray-100 text-gray-500 group-hover:bg-emerald-50 group-hover:text-emerald-500"
        }`}
      >
        <Icon className="w-6 h-6" strokeWidth={1.5} />
      </div>

      <div className="flex-1">
        <span
          className={`text-sm font-semibold transition-colors ${
            value
              ? "text-emerald-900"
              : "text-gray-700 group-hover:text-gray-900"
          }`}
        >
          {label}
        </span>
      </div>

      <div className="transition-all duration-300">
        {value ? (
          isRemovable ? (
            <div className="p-1 bg-white rounded-full border border-emerald-200 text-emerald-600 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors">
              <X className="w-4 h-4" />
            </div>
          ) : (
            <div className="p-1 bg-emerald-500 rounded-full text-white shadow-sm shadow-emerald-200">
              <Check className="w-4 h-4" strokeWidth={3} />
            </div>
          )
        ) : (
          <Plus className="w-5 h-5 text-gray-300 group-hover:text-emerald-500 transition-colors" />
        )}
      </div>
    </div>
  );
};

export default function MedicationsAndConditions({
  norms,
  setNorms,
  onUpdate,
}) {
  const [customCondition, setCustomCondition] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const medicalFlags = [
    { id: "hasPrediabetes", label: "Stan Przedcukrzycowy", icon: Activity },
    { id: "hasDiabetes", label: "Cukrzyca", icon: Droplet },
    { id: "hasHighBloodPressure", label: "Podwyższone ciśnienie", icon: Gauge },
    { id: "hasHypertension", label: "Nadciśnienie", icon: Gauge },
    { id: "hasHeartDisease", label: "Choroby Serca", icon: HeartPulse },
    { id: "hasKidneyDisease", label: "Choroby Nerek", icon: Stethoscope },
  ];

  const activeFlags = medicalFlags.filter((flag) => norms[flag.id]);
  const availableFlags = medicalFlags.filter((flag) => !norms[flag.id]);

  const handleFlagChange = (id, value) => {
    setNorms((prev) => ({ ...prev, [id]: value }));
  };

  const handleAddCustom = () => {
    const trimmed = customCondition.trim();
    if (trimmed && !norms.conditions.includes(trimmed)) {
      setNorms((prev) => ({
        ...prev,
        conditions: [...prev.conditions, trimmed],
      }));
      setCustomCondition("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCustom();
    }
  };

  const handleRemoveCustom = (conditionName) => {
    setNorms((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((c) => c !== conditionName),
    }));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    const loadingToast = toast.loading("Zapisywanie profilu...");

    const payload = {
      activityLevel: norms.activityLevel,
      medications: norms.medications,
      conditions: norms.conditions.join(","),
      hasDiabetes: !!norms.hasDiabetes,
      hasPrediabetes: !!norms.hasPrediabetes,
      hasHighBloodPressure: !!norms.hasHighBloodPressure,
      hasHypertension: !!norms.hasHypertension,
      hasHeartDisease: !!norms.hasHeartDisease,
      hasKidneyDisease: !!norms.hasKidneyDisease,
    };

    try {
      const res = await fetch("/api/user/norms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updatedData = await res.json();
        if (onUpdate) onUpdate(updatedData);

        toast.success("Profil zaktualizowany pomyślnie!");
        setIsAdding(false);
      } else {
        throw new Error();
      }
    } catch {
      toast.error("Wystąpił błąd podczas zapisu.");
    } finally {
      toast.dismiss(loadingToast);
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/40 p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200/50 space-y-10">
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-gray-800 border-b border-gray-100 pb-2">
          <Dumbbell className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-lg">Poziom Aktywności</h3>
        </div>

        <div className="relative group">
          <select
            value={norms.activityLevel || ""}
            onChange={(e) =>
              setNorms((prev) => ({ ...prev, activityLevel: e.target.value }))
            }
            className="w-full appearance-none bg-white border border-gray-200 text-gray-700 rounded-xl px-4 py-3.5 pr-10 text-sm font-medium focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-sm group-hover:border-emerald-300"
          >
            <option value="" disabled>
              Wybierz poziom...
            </option>
            <option value="LOW">Niski (Siedzący tryb życia)</option>
            <option value="MODERATE">
              Umiarkowany (Spacery, lekki trening)
            </option>
            <option value="HIGH">
              Wysoki (Regularny sport, praca fizyczna)
            </option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400 group-hover:text-emerald-600 transition-colors">
            <ChevronDown className="w-5 h-5" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <div className="flex items-center gap-2 text-gray-800">
            <ClipboardList className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-lg">Twoje Diagnozy</h3>
          </div>

          {!isAdding && availableFlags.length > 0 && (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              Dodaj diagnozę
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 transition-all">
          {activeFlags.length === 0 && !isAdding && (
            <div className="col-span-1 md:col-span-2 py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-gray-400 text-sm">
                Brak zaznaczonych diagnoz.
              </p>
              {availableFlags.length > 0 && (
                <button
                  onClick={() => setIsAdding(true)}
                  className="mt-2 text-emerald-600 text-sm font-semibold hover:underline"
                >
                  Dodaj teraz
                </button>
              )}
            </div>
          )}

          {activeFlags.map((flag) => (
            <SimpleConditionCard
              key={flag.id}
              label={flag.label}
              icon={flag.icon}
              value={true}
              isRemovable={true}
              onChange={() => handleFlagChange(flag.id, false)}
            />
          ))}

          {isAdding && (
            <div className="col-span-1 md:col-span-2 space-y-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">
                <span>Dostępne do wyboru:</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in zoom-in duration-300">
                {availableFlags.map((flag) => (
                  <SimpleConditionCard
                    key={flag.id}
                    label={flag.label}
                    icon={flag.icon}
                    value={false}
                    onChange={() => handleFlagChange(flag.id, true)}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Anuluj wybieranie
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2 text-gray-800 border-b border-gray-100 pb-2">
          <PlusCircle className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-lg">Inne Schorzenia</h3>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={customCondition}
              onChange={(e) => setCustomCondition(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="np. Astma, Alergia (wpisz i zatwierdź Enter)"
              className="w-full bg-white border border-gray-200 rounded-xl pl-4 pr-12 py-3 text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-sm"
            />
            <button
              type="button"
              onClick={handleAddCustom}
              disabled={!customCondition.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white disabled:opacity-50 disabled:hover:bg-emerald-100 disabled:hover:text-emerald-600 transition-all"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 min-h-[30px]">
          {norms.conditions.length === 0 && (
            <span className="text-xs text-gray-400 italic pl-1">
              Brak dodatkowych schorzeń.
            </span>
          )}
          {norms.conditions.map((c) => (
            <span
              key={c}
              className="group flex items-center gap-2 bg-white border border-emerald-100 text-emerald-800 pl-3 pr-1 py-1.5 rounded-full text-sm font-medium shadow-sm transition-all hover:border-emerald-300 hover:shadow-md"
            >
              {c}
              <button
                type="button"
                onClick={() => handleRemoveCustom(c)}
                className="p-0.5 rounded-full text-emerald-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </span>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2 text-gray-800 border-b border-gray-100 pb-2">
          <Pill className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-lg">Przyjmowane Leki</h3>
        </div>
        <textarea
          rows={3}
          value={norms.medications || ""}
          onChange={(e) =>
            setNorms((prev) => ({ ...prev, medications: e.target.value }))
          }
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all shadow-sm resize-none"
          placeholder="Lista leków, dawkowanie..."
        />
      </section>

      <div className="pt-4">
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={isSaving}
          className={`w-full flex items-center justify-center gap-2 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-[0.98] ${
            isSaving
              ? "bg-emerald-400 cursor-not-allowed"
              : "bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-300"
          }`}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Zapisywanie...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Zatwierdź zmiany w profilu
            </>
          )}
        </button>
      </div>
    </div>
  );
}
