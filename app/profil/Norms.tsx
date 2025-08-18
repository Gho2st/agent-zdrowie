"use client";

import toast from "react-hot-toast";
import { ChangeEvent } from "react";
import { useState } from "react";

interface NormsProps {
  norms: Record<string, number>;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

const fieldLabels: Record<string, string> = {
  systolicMin: "Ciśnienie skurczowe (min)",
  systolicMax: "Ciśnienie skurczowe (max)",
  diastolicMin: "Ciśnienie rozkurczowe (min)",
  diastolicMax: "Ciśnienie rozkurczowe (max)",
  glucoseFastingMin: "Glukoza na czczo (min)",
  glucoseFastingMax: "Glukoza na czczo (max)",
  glucosePrediabetesFastingMin: "Glukoza przedcukrzycowa (min)",
  glucosePrediabetesFastingMax: "Glukoza przedcukrzycowa (max)",
  glucosePostMealMax: "Glukoza po posiłku (max)",
  weightMin: "Waga (min)",
  weightMax: "Waga (max)",
  pulseMin: "Puls (min)",
  pulseMax: "Puls (max)",
};

export default function Norms({ norms, handleChange }: NormsProps) {
  const [editingNorms, setEditingNorms] = useState(false);

  const fields = Object.keys(fieldLabels);

  return (
    <div className="bg-white/30 backdrop-blur-lg border border-white/20 p-6 rounded-xl shadow-md">
      <p className="font-semibold mb-4">
        Masz własne normy od lekarza? Możesz je tutaj zaktualizować:
      </p>

      {!editingNorms ? (
        <button
          className="bg-green-600 text-white px-4 py-2 rounded-lg cursor-pointer"
          onClick={() => setEditingNorms(true)}
        >
          Edytuj normy
        </button>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {fields.map((field) => (
              <label key={field} className="block">
                {fieldLabels[field]}:
                <input
                  type="number"
                  name={field}
                  value={norms[field] || ""}
                  onChange={handleChange}
                  className="block w-full mt-1 border px-3 py-2 rounded-md"
                />
              </label>
            ))}
          </div>

          <div className="flex gap-4 mt-4">
            <button
              onClick={async () => {
                const dataToSend = Object.fromEntries(
                  fields.map((key) => [key, norms[key]])
                );

                const res = await fetch("/api/user/norms", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(dataToSend),
                });

                if (res.ok) {
                  toast.success("Zapisano normy");
                  setEditingNorms(false);
                } else {
                  toast.error("Wystąpił błąd podczas zapisywania");
                }
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer"
            >
              Zapisz
            </button>
            <button
              onClick={() => setEditingNorms(false)}
              className="text-gray-500 underline cursor-pointer"
            >
              Anuluj
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
