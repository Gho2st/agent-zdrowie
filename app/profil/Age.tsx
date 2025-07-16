import { LuPencil, LuCheck, LuX } from "react-icons/lu";
import { useState, useEffect } from "react";

interface AgeProps {
  norms: {
    birthdate: string | Date;
    height: number;
    weight: number;
    bmi?: number;
  };
  saveHeight: (newHeight: number) => void;
  saveWeight: (newWeight: number) => void;
  editingWeight: boolean;
  setEditingWeight: React.Dispatch<React.SetStateAction<boolean>>;
  editingHeight: boolean;
  setEditingHeight: React.Dispatch<React.SetStateAction<boolean>>;
}

function calculateAge(birthdate: string | Date): number {
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
}: AgeProps) {
  const age = calculateAge(norms.birthdate);
  const [tempWeight, setTempWeight] = useState(norms.weight);
  const [tempHeight, setTempHeight] = useState(norms.height);
  const [weightError, setWeightError] = useState("");
  const [heightError, setHeightError] = useState("");

  // Sync local temp values when switching to edit mode
  useEffect(() => {
    if (editingWeight) setTempWeight(norms.weight);
  }, [editingWeight, norms.weight]);

  useEffect(() => {
    if (editingHeight) setTempHeight(norms.height);
  }, [editingHeight, norms.height]);

  const validateWeight = (): boolean => {
    if (tempWeight < 30 || tempWeight > 300) {
      setWeightError("Waga musi być w zakresie 30–300 kg");
      return false;
    }
    setWeightError("");
    return true;
  };

  const validateHeight = (): boolean => {
    if (tempHeight < 100 || tempHeight > 250) {
      setHeightError("Wzrost musi być w zakresie 100–250 cm");
      return false;
    }
    setHeightError("");
    return true;
  };

  return (
    <div className="flex flex-col gap-3">
      <span className="text-lg font-medium">{age} lat</span>

      {/* Wzrost */}
      {!editingHeight ? (
        <div className="flex items-center gap-2">
          <span className="text-lg">{norms.height} cm</span>
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
              value={
                tempHeight !== undefined && !isNaN(tempHeight) ? tempHeight : ""
              }
              onChange={(e) => setTempHeight(parseInt(e.target.value))}
              className="w-28 p-2 border rounded"
            />
            <button
              onClick={() => {
                if (validateHeight()) {
                  saveHeight(tempHeight);
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
                setTempHeight(norms.height); // przywracamy oryginał
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
          <span className="text-lg">{norms.weight} kg</span>
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
              value={
                tempWeight !== undefined && !isNaN(tempWeight) ? tempWeight : ""
              }
              onChange={(e) => setTempWeight(parseFloat(e.target.value))}
              className="w-28 p-2 border rounded"
            />
            <button
              onClick={() => {
                if (validateWeight()) {
                  saveWeight(tempWeight);
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
                setTempWeight(norms.weight); // przywracamy oryginał
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

      {norms.bmi !== undefined && (
        <span className="text-lg">BMI: {norms.bmi.toFixed(1)}</span>
      )}
    </div>
  );
}
