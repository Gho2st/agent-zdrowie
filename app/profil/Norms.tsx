import { useState, ChangeEvent } from "react";
import toast from "react-hot-toast";
interface NormsProps {
  norms: Record<string, number>;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  setNorms: React.Dispatch<React.SetStateAction<any>>;
}

export default function Norms({ norms, handleChange }: NormsProps) {
  const [editingNorms, setEditingNorms] = useState(false);

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <p className="font-semibold mb-4">
        Masz własne normy od lekarza? Możesz je tutaj zaktualizować:
      </p>

      {!editingNorms ? (
        <button
          className="bg-green-600 text-white px-4 py-2 rounded-lg"
          onClick={() => setEditingNorms(true)}
        >
          Edytuj normy
        </button>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              "systolicMin",
              "systolicMax",
              "diastolicMin",
              "diastolicMax",
              "glucoseFastingMin",
              "glucoseFastingMax",
              "glucosePostMealMax",
              "weightMin",
              "weightMax",
            ].map((field) => (
              <label key={field} className="block">
                {field}:
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
                const fieldsToSend = [
                  "systolicMin",
                  "systolicMax",
                  "diastolicMin",
                  "diastolicMax",
                  "glucoseFastingMin",
                  "glucoseFastingMax",
                  "glucosePostMealMax",
                  "weightMin",
                  "weightMax",
                ];
                const dataToSend = Object.fromEntries(
                  fieldsToSend.map((key) => [key, norms[key]])
                );

                const res = await fetch("/api/user/norms", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(dataToSend),
                });

                if (res.ok) {
                  toast.success("Zapisano normy");
                  setEditingNorms(false);
                }
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Zapisz
            </button>
            <button
              onClick={() => setEditingNorms(false)}
              className="text-gray-500 underline"
            >
              Anuluj
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
