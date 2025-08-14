"use client";

import toast from "react-hot-toast";
import { Dispatch, SetStateAction } from "react";
import { Save, X } from "lucide-react";

interface NormsState {
  // trzymamy tekst w textarea; przy zapisie zamienimy na string[]
  medications?: string;
  conditions?: string;
}

interface Props {
  norms: NormsState;
  setNorms: Dispatch<SetStateAction<NormsState>>;
}

const normalizeList = (text: string) =>
  text
    .split(/[,\n;]+/) // przecinki, entery, średniki
    .map((s) => s.trim())
    .filter(Boolean);

export default function MedicationsAndConditions({ norms, setNorms }: Props) {
  const handleSave = async (field: keyof NormsState) => {
    const value = norms[field]?.trim();
    if (!value) {
      toast.error("Wprowadź dane zanim zapiszesz.");
      return;
    }

    const list = normalizeList(value); // ← wyślemy TABELĘ do API

    const res = await fetch("/api/user/norms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: list }),
    });

    if (res.ok) {
      toast.success("Zapisano!");
    } else {
      toast.error("Wystąpił błąd przy zapisie.");
    }
  };

  const handleClear = async (field: keyof NormsState) => {
    const hasData = Boolean(norms[field] && norms[field]!.trim());
    if (!hasData) {
      toast("Brak danych do usunięcia.");
      return;
    }

    const res = await fetch("/api/user/norms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: null }), // ← czyścimy w DB (Json null)
    });

    if (res.ok) {
      setNorms((prev) => ({ ...prev, [field]: "" }));
      toast.success("Usunięto dane.");
    } else {
      toast.error("Błąd przy usuwaniu.");
    }
  };

  return (
    <div className="bg-white/30 backdrop-blur-lg border border-white/20 p-6 rounded-xl shadow-md space-y-6">
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
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/70 disabled:cursor-not-allowed disabled:opacity-60"
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

      {/* Choroby */}
      <div>
        <label className="font-semibold block mb-1">
          🩺 Jakie masz choroby lub diagnozy? (opcjonalne)
        </label>
        <textarea
          rows={2}
          placeholder="np. cukrzyca typu 2, nadciśnienie"
          value={norms.conditions || ""}
          onChange={(e) =>
            setNorms((prev) => ({
              ...prev,
              conditions: e.target.value,
            }))
          }
          className="w-full border rounded px-3 py-2 text-sm"
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleSave("conditions")}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/70 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            Zapisz
          </button>

          <button
            onClick={() => handleClear("conditions")}
            className="inline-flex items-center bg-red-100 gap-2 rounded-lg border border-red-200 px-3.5 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500/60"
          >
            <X className="h-4 w-4" />
            Wyczyść
          </button>
        </div>
      </div>
    </div>
  );
}
