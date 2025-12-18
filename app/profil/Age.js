"use client";

import { LuPencil, LuCheck, LuX } from "react-icons/lu";
import { useState, useEffect } from "react";
import { Weight, Ruler, Calendar, Activity } from "lucide-react";
import BMICompact from "./Bmi";

async function updateUserData(data) {
  await fetch("/api/user/norms", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

function calculateAge(birthdate) {
  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export default function Age({
  norms,
  saveWeight,
  saveHeight,
  editingWeight,
  setEditingWeight,
  editingHeight,
  setEditingHeight,
}) {
  const age = calculateAge(norms.birthdate);
  const [tempWeight, setTempWeight] = useState(norms.weight ?? null);
  const [tempHeight, setTempHeight] = useState(norms.height ?? null);
  const [weightError, setWeightError] = useState("");
  const [heightError, setHeightError] = useState("");

  useEffect(() => {
    if (editingWeight) setTempWeight(norms.weight ?? null);
  }, [editingWeight, norms.weight]);

  useEffect(() => {
    if (editingHeight) setTempHeight(norms.height ?? null);
  }, [editingHeight, norms.height]);

  const validateWeight = () => {
    const numericWeight = parseFloat(tempWeight);
    if (isNaN(numericWeight) || numericWeight < 30 || numericWeight > 300) {
      setWeightError("30 - 300 kg");
      return false;
    }
    setWeightError("");
    setTempWeight(numericWeight);
    return true;
  };

  const validateHeight = () => {
    const numericHeight = parseInt(tempHeight, 10);
    if (isNaN(numericHeight) || numericHeight < 100 || numericHeight > 250) {
      setHeightError("100 - 250 cm");
      return false;
    }
    setHeightError("");
    setTempHeight(numericHeight);
    return true;
  };

  return (
    <div className="h-full bg-white/80 backdrop-blur-xl border border-white/40 p-6 rounded-3xl shadow-xl shadow-slate-200/50 flex flex-col justify-between">
      {/* Nagłówek: Wiek */}
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
          <Calendar className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Wiek
          </p>
          <p className="text-2xl font-bold text-gray-800 leading-none">
            {age} lat
          </p>
        </div>
      </div>

      <div className="space-y-4 flex-1">
        {/* Sekcja: Wzrost */}
        <div className="group relative bg-white border border-gray-100 rounded-2xl p-3 hover:border-emerald-200 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Ruler className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400">Wzrost</p>
                {!editingHeight ? (
                  <p className="font-bold text-gray-700">
                    {norms.height ? (
                      `${norms.height} cm`
                    ) : (
                      <span className="text-gray-400 italic">Brak</span>
                    )}
                  </p>
                ) : (
                  // Tryb edycji Wzrostu
                  <div className="flex items-center gap-2 mt-1">
                    <div className="relative">
                      <input
                        type="number"
                        autoFocus
                        value={
                          tempHeight === null || isNaN(tempHeight)
                            ? ""
                            : String(tempHeight)
                        }
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setTempHeight(isNaN(val) ? e.target.value : val);
                        }}
                        // ZMIANY TUTAJ:
                        // 1. pr-8: duży padding z prawej, żeby tekst nie najechał na "cm"
                        // 2. [appearance:textfield]: usuwa strzałki w Firefox
                        // 3. [&::-webkit...]: usuwa strzałki w Chrome/Safari
                        className="w-24 bg-gray-50 border border-emerald-200 rounded-lg pl-3 pr-8 py-1 text-sm font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      {/* pointer-events-none: sprawia, że kliknięcie w "cm" przenosi focus do inputa */}
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none">
                        cm
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Przyciski akcji Wzrost */}
            {!editingHeight ? (
              <button
                onClick={() => setEditingHeight(true)}
                className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              >
                <LuPencil className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex gap-1">
                <button
                  onClick={async () => {
                    if (validateHeight()) {
                      saveHeight(tempHeight);
                      await updateUserData({ height: tempHeight });
                      setEditingHeight(false);
                    }
                  }}
                  className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 shadow-sm shadow-emerald-200"
                >
                  <LuCheck className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setEditingHeight(false);
                    setHeightError("");
                    setTempHeight(norms.height ?? null);
                  }}
                  className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200"
                >
                  <LuX className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          {heightError && (
            <p className="text-xs text-red-500 mt-2 pl-1">{heightError}</p>
          )}
        </div>

        {/* Sekcja: Waga */}
        <div className="group relative bg-white border border-gray-100 rounded-2xl p-3 hover:border-emerald-200 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Weight className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400">Waga</p>
                {!editingWeight ? (
                  <p className="font-bold text-gray-700">
                    {norms.weight ? (
                      `${norms.weight} kg`
                    ) : (
                      <span className="text-gray-400 italic">Brak</span>
                    )}
                  </p>
                ) : (
                  // Tryb edycji Wagi
                  <div className="flex items-center gap-2 mt-1">
                    <div className="relative">
                      <input
                        type="number"
                        autoFocus
                        value={
                          tempWeight === null || isNaN(tempWeight)
                            ? ""
                            : String(tempWeight)
                        }
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setTempWeight(isNaN(val) ? e.target.value : val);
                        }}
                        // TE SAME ZMIANY CO WYŻEJ
                        className="w-24 bg-gray-50 border border-emerald-200 rounded-lg pl-3 pr-8 py-1 text-sm font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none">
                        kg
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Przyciski akcji Waga */}
            {!editingWeight ? (
              <button
                onClick={() => setEditingWeight(true)}
                className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              >
                <LuPencil className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex gap-1">
                <button
                  onClick={async () => {
                    if (validateWeight()) {
                      saveWeight(tempWeight);
                      await updateUserData({ weight: tempWeight });
                      setEditingWeight(false);
                    }
                  }}
                  className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 shadow-sm shadow-emerald-200"
                >
                  <LuCheck className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setEditingWeight(false);
                    setWeightError("");
                    setTempWeight(norms.weight ?? null);
                  }}
                  className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200"
                >
                  <LuX className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          {weightError && (
            <p className="text-xs text-red-500 mt-2 pl-1">{weightError}</p>
          )}
        </div>
      </div>

      {/* Sekcja BMI */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-2 text-gray-600">
          <Activity className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Twój Indeks BMI
          </span>
        </div>
        {norms.bmi !== undefined ? (
          <BMICompact bmi={norms.bmi} />
        ) : (
          <p className="text-sm text-gray-400 italic">
            Uzupełnij wagę i wzrost.
          </p>
        )}
      </div>
    </div>
  );
}
