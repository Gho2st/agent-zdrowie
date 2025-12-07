"use client";

import { LuPencil, LuCheck, LuX } from "react-icons/lu";
import { useState, useEffect } from "react";
import { Weight, Ruler, Calendar } from "lucide-react";
import BMICompact from "./Bmi";

// Funkcja do aktualizacji danych użytkownika w backendzie
async function updateUserData(data) {
  await fetch("/api/user/norms", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

// Obliczanie wieku z daty urodzenia
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

  // Synchronizuj tymczasowe wartości przy przejściu w tryb edycji
  useEffect(() => {
    if (editingWeight) setTempWeight(norms.weight ?? null);
  }, [editingWeight, norms.weight]);

  useEffect(() => {
    if (editingHeight) setTempHeight(norms.height ?? null);
  }, [editingHeight, norms.height]);

  const validateWeight = () => {
    const numericWeight = parseFloat(tempWeight);
    if (isNaN(numericWeight) || numericWeight < 30 || numericWeight > 300) {
      setWeightError("Waga musi być w zakresie 30–300 kg");
      return false;
    }
    setWeightError("");
    // Aktualizujemy tempWeight na sformatowaną liczbę, aby była spójna (jeśli była stringiem)
    setTempWeight(numericWeight);
    return true;
  };

  const validateHeight = () => {
    const numericHeight = parseInt(tempHeight, 10);
    if (isNaN(numericHeight) || numericHeight < 100 || numericHeight > 250) {
      setHeightError("Wzrost musi być w zakresie 100–250 cm");
      return false;
    }
    setHeightError("");
    // Aktualizujemy tempHeight na sformatowaną liczbę
    setTempHeight(numericHeight);
    return true;
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span>
          <Calendar />
        </span>
        <span className="text-lg font-bold">{age} lat</span>
      </div>

      {/* Wzrost */}
      {!editingHeight ? (
        <div className="flex items-center gap-2">
          <span>
            <Ruler />
          </span>
          {/* Używamy norms.height bezpośrednio, jeśli jest dostępny, inaczej wyświetlamy placeholder */}
          <span className="text-lg font-bold">
            {norms.height ? `${norms.height} cm` : "Brak danych"}
          </span>
          <button
            onClick={() => setEditingHeight(true)}
            className="text-blue-600 hover:text-blue-800 cursor-pointer"
            title="Edytuj wzrost"
          >
            <LuPencil />
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <input
              type="number"
              name="height"
              // Jeśli tempHeight jest null/undefined, wyświetlamy pusty string, inaczej jego wartość.
              // Używamy String() dla pewności w obsłudze wartości w polu input
              value={
                tempHeight === null || isNaN(tempHeight)
                  ? ""
                  : String(tempHeight)
              }
              onChange={(e) => {
                // Konwersja na liczbę całkowitą (wzrost w cm)
                const val = parseInt(e.target.value, 10);
                setTempHeight(isNaN(val) ? e.target.value : val); // Zostawiamy string, jeśli jest pusty lub niepoprawny
              }}
              className="w-28 p-2 border rounded"
            />
            <button
              onClick={async () => {
                if (validateHeight()) {
                  // Po udanej walidacji, tempHeight jest już liczbą
                  saveHeight(tempHeight);
                  await updateUserData({ height: tempHeight });
                  setEditingHeight(false);
                }
              }}
              className="bg-green-600 hover:bg-green-700 text-white p-2 rounded cursor-pointer"
              title="Zapisz"
            >
              <LuCheck />
            </button>
            <button
              onClick={() => {
                setEditingHeight(false);
                setHeightError("");
                setTempHeight(norms.height ?? null);
              }}
              className="text-gray-500 hover:text-gray-700 cursor-pointer"
              title="Anuluj"
            >
              <LuX />
            </button>
          </div>
          {heightError && <p className="text-sm text-red-600">{heightError}</p>}
        </div>
      )}

      {/* Waga */}
      {!editingWeight ? (
        <div className="flex items-center gap-2">
          <span>
            <Weight />
          </span>
          <span className="text-lg font-bold">
            {norms.weight ? `${norms.weight} kg` : "Brak danych"}
          </span>
          <button
            onClick={() => setEditingWeight(true)}
            className="text-blue-600 hover:text-blue-800 cursor-pointer"
            title="Edytuj wagę"
          >
            <LuPencil />
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <input
              type="number"
              name="weight"
              // Jeśli tempWeight jest null/undefined, wyświetlamy pusty string, inaczej jego wartość
              value={
                tempWeight === null || isNaN(tempWeight)
                  ? ""
                  : String(tempWeight)
              }
              onChange={(e) => {
                // Używamy parseFloat (waga może być dziesiętna)
                const val = parseFloat(e.target.value);
                setTempWeight(isNaN(val) ? e.target.value : val);
              }}
              className="w-28 p-2 border rounded"
            />
            <button
              onClick={async () => {
                if (validateWeight()) {
                  // Po udanej walidacji, tempWeight jest już liczbą
                  saveWeight(tempWeight);
                  await updateUserData({ weight: tempWeight });
                  setEditingWeight(false);
                }
              }}
              className="bg-green-600 hover:bg-green-700 text-white p-2 cursor-pointer rounded"
              title="Zapisz"
            >
              <LuCheck />
            </button>
            <button
              onClick={() => {
                setEditingWeight(false);
                setWeightError("");
                setTempWeight(norms.weight ?? null);
              }}
              className="text-gray-500 hover:text-gray-700 cursor-pointer"
              title="Anuluj"
            >
              <LuX />
            </button>
          </div>
          {weightError && <p className="text-sm text-red-600">{weightError}</p>}
        </div>
      )}

      {/* BMI */}

      {norms.bmi !== undefined && <BMICompact bmi={norms.bmi} />}
    </div>
  );
}
