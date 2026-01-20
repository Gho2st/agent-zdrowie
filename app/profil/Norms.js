"use client";

import toast from "react-hot-toast";
import { useState, useEffect, useRef } from "react";
import {
  Edit2,
  Save,
  Loader2,
  CheckCircle,
  Settings2,
  RotateCcw,
} from "lucide-react"; // <-- Dodałem RotateCcw

// ... (fieldLabels bez zmian) ...
const fieldLabels = {
  systolicMin: "Ciśnienie skurczowe (min)",
  systolicMax: "Ciśnienie skurczowe (max)",
  diastolicMin: "Ciśnienie rozkurczowe (min)",
  diastolicMax: "Ciśnienie rozkurczowe (max)",
  glucoseFastingMin: "Glukoza na czczo (min)",
  glucoseFastingMax: "Glukoza na czczo (max)",
  glucosePostMealMax: "Glukoza po posiłku (max)",
  weightMin: "Waga (min)",
  weightMax: "Waga (max)",
  pulseMin: "Puls (min)",
  pulseMax: "Puls (max)",
  maxHeartRate: "HR Max",
  targetHeartRateMin: "Tętno docelowe (min)",
  targetHeartRateMax: "Tętno docelowe (max)",
};

export default function Norms({ norms, handleChange, onUpdate }) {
  const [editingNorms, setEditingNorms] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [highlight, setHighlight] = useState(false);
  const prevNormsRef = useRef(norms);
  const [initialNorms, setInitialNorms] = useState({});
  const fields = Object.keys(fieldLabels);

  useEffect(() => {
    if (JSON.stringify(prevNormsRef.current) !== JSON.stringify(norms)) {
      setHighlight(true);
      const timer = setTimeout(() => setHighlight(false), 2000);
      prevNormsRef.current = norms;
      return () => clearTimeout(timer);
    }
  }, [norms]);

  const startEditing = () => {
    setInitialNorms({ ...norms });
    setEditingNorms(true);
  };

  // --- NOWA FUNKCJA RESETU ---
  const handleReset = async () => {
    if (!confirm("Czy na pewno chcesz przywrócić domyślne normy medyczne?"))
      return;

    setIsSaving(true);
    try {
      // Wysyłamy flagę reset: true
      const res = await fetch("/api/user/norms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset: true }),
      });

      if (res.ok) {
        const updatedData = await res.json();
        if (onUpdate) onUpdate(updatedData);
        toast.success("Przywrócono wartości domyślne");
        setEditingNorms(false); // Wychodzimy z trybu edycji
      } else {
        const err = await res.json();
        toast.error(err.error || "Błąd resetowania");
      }
    } catch (err) {
      console.error(err);
      toast.error("Błąd połączenia");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const changedData = {};

    fields.forEach((key) => {
      let current = norms[key];
      let initial = initialNorms[key];

      if (current === "") current = null;
      if (initial === "") initial = null;

      const numCurrent = current !== null ? Number(current) : null;
      const numInitial = initial !== null ? Number(initial) : null;

      if (numCurrent !== numInitial) {
        changedData[key] = current;
      }
    });

    if (Object.keys(changedData).length === 0) {
      toast("Nic nie zmieniono", { icon: "ℹ️" });
      setIsSaving(false);
      setEditingNorms(false);
      return;
    }

    try {
      const res = await fetch("/api/user/norms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changedData),
      });

      if (res.ok) {
        const updatedData = await res.json();
        if (onUpdate) onUpdate(updatedData);
        toast.success("Zapisano zmiany");
        setEditingNorms(false);
      } else {
        const err = await res.json();
        toast.error(err.error || "Błąd podczas zapisywania");
      }
    } catch (err) {
      console.error(err);
      toast.error("Błąd połączenia");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/40 p-6 rounded-3xl shadow-xl shadow-slate-200/50 h-full flex flex-col transition-all">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl mt-1">
            <Settings2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
              Normy Medyczne
              {highlight && !editingNorms && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full animate-in fade-in slide-in-from-left-2 duration-300">
                  Zaktualizowano
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-500 mt-1 leading-snug max-w-xs">
              Parametry wyliczone przez algorytm lub ustawione ręcznie.
            </p>
          </div>
        </div>

        {!editingNorms && (
          <button
            onClick={startEditing}
            className="p-2.5 bg-white border border-gray-200 text-gray-500 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 rounded-xl transition-all shadow-sm"
            title="Edytuj ręcznie"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {!editingNorms ? (
        <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
          {fields.map((field) => (
            <div
              key={field}
              className={`
                flex flex-col border-b border-gray-100 pb-2 last:border-0 rounded-lg px-2 transition-all duration-700
                ${highlight ? "bg-emerald-50/60 border-emerald-100 scale-[1.02]" : "bg-transparent"}
              `}
            >
              <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">
                {fieldLabels[field]}
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`font-bold text-base transition-colors duration-500 ${
                    highlight ? "text-emerald-700" : "text-gray-800"
                  }`}
                >
                  {norms[field] !== null && norms[field] !== ""
                    ? norms[field]
                    : "—"}
                </span>
                {highlight && (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 animate-in zoom-in duration-300" />
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto pr-2 custom-scrollbar mb-4 flex-1">
            {fields.map((field) => (
              <label key={field} className="block group">
                <span className="text-xs font-bold text-gray-500 group-focus-within:text-emerald-600 transition-colors ml-1 mb-1 block">
                  {fieldLabels[field]}
                </span>
                <input
                  type="number"
                  name={field}
                  value={norms[field] ?? ""}
                  onChange={handleChange}
                  placeholder="Auto"
                  className="block w-full bg-gray-50/50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none transition-all"
                />
              </label>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100 mt-auto">
            {/* PRZYCISK ZAPISZ */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`flex-1 order-1 sm:order-2 flex justify-center items-center gap-2 px-4 py-3 rounded-xl font-bold text-white transition-all shadow-lg active:scale-95 ${
                isSaving
                  ? "bg-emerald-400 cursor-not-allowed shadow-none"
                  : "bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-200 hover:shadow-emerald-300 hover:scale-[1.02]"
              }`}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving ? "Zapisywanie..." : "Zapisz"}
            </button>

            {/* PRZYCISK ANULUJ */}
            <button
              disabled={isSaving}
              onClick={() => setEditingNorms(false)}
              className="order-2 sm:order-3 px-4 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl font-bold transition-colors"
            >
              Anuluj
            </button>

            {/* PRZYCISK RESET (NOWY) */}
            <button
              onClick={handleReset}
              disabled={isSaving}
              className="order-3 sm:order-1 px-3 py-3 text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
              title="Przywróć wartości domyślne"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="sm:hidden">Reset</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
