"use client";

import toast from "react-hot-toast";
import { Dispatch, SetStateAction, useState } from "react";
import { Save, X } from "lucide-react";

interface NormsState {
  medications?: string;
  conditions: string[]; // Tablica chorób w interfejsie
  activityLevel?: string; // "niski", "umiarkowany", "wysoki"
}

interface Props {
  norms: NormsState;
  setNorms: Dispatch<SetStateAction<NormsState>>;
}

export default function MedicationsAndConditions({ norms, setNorms }: Props) {
  const [gender] = useState<"M" | "K" | null>(null);
  const [customCondition, setCustomCondition] = useState("");

  // Dodawanie niestandardowej kondycji
  const handleAddCustomCondition = () => {
    const trimmedCondition = customCondition.trim();
    if (!trimmedCondition) {
      toast.error("Wpisz nazwę kondycji");
      return;
    }
    if (norms.conditions.includes(trimmedCondition)) {
      toast.error("Ta choroba już istnieje");
      return;
    }
    setNorms((prev) => ({
      ...prev,
      conditions: [...prev.conditions, trimmedCondition],
    }));
    setCustomCondition("");
  };

  // Usuwanie
  const handleRemoveCondition = (condition: string) => {
    setNorms((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((c) => c !== condition),
    }));
  };

  // Zaznaczanie predefiniowanej kondycji
  const handleConditionChange = (condition: string) => {
    setNorms((prev) => ({
      ...prev,
      conditions: prev.conditions.includes(condition)
        ? prev.conditions.filter((c) => c !== condition)
        : [...prev.conditions, condition],
    }));
  };

  const handleSave = async (field: keyof NormsState) => {
    let value = norms[field];
    if (field === "conditions") {
      if (!norms.conditions.length) {
        toast.error("Wybierz lub wpisz co najmniej jedną kondycję");
        return;
      }
      value = norms.conditions.join(","); // Konwersja na ciąg dla bazy
    } else if (field === "medications" && !value?.toString().trim()) {
      toast.error("Wprowadź leki lub wyczyść pole");
      return;
    } else if (field === "activityLevel" && !value) {
      toast.error("Wybierz poziom aktywności");
      return;
    }

    const payload = { [field]: value };

    const res = await fetch("/api/user/norms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      toast.success("Zapisano!");
    } else {
      toast.error("Wystąpił błąd przy zapisie.");
    }
  };

  const handleClear = async (field: keyof NormsState) => {
    const hasData =
      field === "conditions"
        ? norms.conditions.length > 0
        : Boolean(norms[field]?.toString().trim());
    if (!hasData) {
      toast("Brak danych do usunięcia.");
      return;
    }

    const res = await fetch("/api/user/norms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: null }),
    });

    if (res.ok) {
      setNorms((prev) => ({
        ...prev,
        [field]: field === "conditions" ? [] : "",
      }));
      toast.success("Usunięto dane.");
    } else {
      toast.error("Błąd przy usuwaniu.");
    }
  };

  return (
    <div className="bg-white/30 backdrop-blur-lg border border-white/20 p-6 rounded-xl shadow-md space-y-6">
      {/* Poziom aktywności fizycznej */}
      <div>
        <label className="font-semibold block mb-1">
          🏃 Poziom aktywności fizycznej
        </label>
        <select
          value={norms.activityLevel || ""}
          onChange={(e) =>
            setNorms((prev) => ({
              ...prev,
              activityLevel: e.target.value as
                | "niski"
                | "umiarkowany"
                | "wysoki",
            }))
          }
          className="w-full border rounded px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Wybierz poziom aktywności
          </option>
          <option value="niski">Niski (brak regularnego ruchu)</option>
          <option value="umiarkowany">
            Umiarkowany (np. spacery, lekki sport)
          </option>
          <option value="wysoki">Wysoki (regularny sport, treningi)</option>
        </select>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleSave("activityLevel")}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/70"
          >
            <Save className="h-4 w-4" />
            Zapisz
          </button>
          <button
            onClick={() => handleClear("activityLevel")}
            className="inline-flex items-center gap-2 bg-red-100 rounded-lg border border-red-200 px-3.5 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500/60"
          >
            <X className="h-4 w-4" />
            Wyczyść
          </button>
        </div>
      </div>

      {/* Kod */}
      <div>
        <label className="font-semibold block mb-1">🩺 Stan zdrowia</label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={norms.conditions.includes("cukrzyca")}
              onChange={() => handleConditionChange("cukrzyca")}
              className="mr-2"
            />
            Cukrzyca
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={norms.conditions.includes("nadciśnienie")}
              onChange={() => handleConditionChange("nadciśnienie")}
              className="mr-2"
            />
            Nadciśnienie
          </label>
          {gender === "K" && (
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={norms.conditions.includes("ciąża")}
                onChange={() => handleConditionChange("ciąża")}
                className="mr-2"
              />
              Ciąża
            </label>
          )}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customCondition}
              onChange={(e) => setCustomCondition(e.target.value)}
              placeholder="Wpisz własną kondycję (np. astma)"
              className="w-full border rounded px-3 py-2 text-sm"
            />
            <button
              onClick={handleAddCustomCondition}
              className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700"
            >
              Dodaj
            </button>
          </div>
          {norms.conditions.length > 0 && (
            <div className="mt-2">
              <p className="font-semibold">Zapisane:</p>
              <ul className="list-disc pl-5">
                {norms.conditions.map((condition) => (
                  <li
                    key={condition}
                    className="flex items-center justify-between"
                  >
                    {condition}
                    <button
                      onClick={() => handleRemoveCondition(condition)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleSave("conditions")}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/70"
          >
            <Save className="h-4 w-4" />
            Zapisz
          </button>
          <button
            onClick={() => handleClear("conditions")}
            className="inline-flex items-center gap-2 bg-red-100 rounded-lg border border-red-200 px-3.5 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500/60"
          >
            <X className="h-4 w-4" />
            Wyczyść
          </button>
        </div>
      </div>

      {/* Leki */}
      <div>
        <label className="font-semibold block mb-1">
          💊 Jakie leki obecnie przyjmujesz? (opcjonalne)
        </label>
        <textarea
          rows={2}
          placeholder="np. Metformina, Bisoprolol"
          value={norms.medications || ""}
          onChange={(e) =>
            setNorms((prev) => ({
              ...prev,
              medications: e.target.value,
            }))
          }
          className="w-full border rounded px-3 py-2 text-sm"
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleSave("medications")}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/70"
          >
            <Save className="h-4 w-4" />
            Zapisz
          </button>
          <button
            onClick={() => handleClear("medications")}
            className="inline-flex items-center gap-2 bg-red-100 rounded-lg border border-red-200 px-3.5 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500/60"
          >
            <X className="h-4 w-4" />
            Wyczyść
          </button>
        </div>
      </div>
    </div>
  );
}
