"use client";

import toast from "react-hot-toast";
import { Dispatch, SetStateAction } from "react";

interface NormsState {
  medications?: string;
  conditions?: string;
}

interface Props {
  norms: NormsState;
  setNorms: Dispatch<SetStateAction<NormsState>>;
}

export default function MedicationsAndConditions({ norms, setNorms }: Props) {
  const handleSave = async (field: keyof NormsState) => {
    const value = norms[field]?.trim();
    if (!value) {
      toast.error(`Wprowadź dane zanim zapiszesz.`);
      return;
    }

    const res = await fetch("/api/user/norms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });

    if (res.ok) {
      toast.success("Zapisano!");
    } else {
      toast.error("Wystąpił błąd przy zapisie.");
    }
  };

  const handleClear = async (field: keyof NormsState) => {
    if (!norms[field]) {
      toast("Brak danych do usunięcia.");
      return;
    }

    const res = await fetch("/api/user/norms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: null }),
    });

    if (res.ok) {
      setNorms((prev) => ({ ...prev, [field]: "" }));
      toast.success("Usunięto dane.");
    } else {
      toast.error("Błąd przy usuwaniu.");
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
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
        <div className="mt-2 flex gap-4 flex-wrap">
          <button
            onClick={() => handleSave("medications")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-sm"
          >
            💾 Zapisz leki
          </button>
          <button
            onClick={() => handleClear("medications")}
            className="text-red-600 hover:text-red-700 underline text-sm"
          >
            ❌ Usuń wszystkie leki
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
        <div className="mt-2 flex gap-4 flex-wrap">
          <button
            onClick={() => handleSave("conditions")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-sm"
          >
            💾 Zapisz choroby
          </button>
          <button
            onClick={() => handleClear("conditions")}
            className="text-red-600 hover:text-red-700 underline text-sm"
          >
            ❌ Usuń wszystkie choroby
          </button>
        </div>
      </div>
    </div>
  );
}
