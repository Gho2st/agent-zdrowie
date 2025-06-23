import toast from "react-hot-toast";

interface AgeProps {
  norms: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  saveAge: () => void;
  editingAge: boolean;
  setEditingAge: React.Dispatch<React.SetStateAction<boolean>>;
}
export default function Age({
  norms,
  handleChange,
  saveAge,
  editingAge,
  setEditingAge,
}: AgeProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <p className="font-semibol text-xl font-bold mb-4">Twój wiek</p>

      {!editingAge ? (
        <div className="flex justify-between items-center">
          <span className="text-lg">{norms.age} lat</span>
          <button
            onClick={() => setEditingAge(true)}
            className="text-blue-600 underline"
          >
            Edytuj
          </button>
        </div>
      ) : (
        <div className="flex gap-4 items-center">
          <input
            type="number"
            name="age"
            value={isNaN(norms.age) ? "" : norms.age}
            onChange={handleChange}
            className="w-24 p-2 border rounded"
          />
          <button
            onClick={saveAge}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Zapisz
          </button>
          <button
            onClick={() => setEditingAge(false)}
            className="text-gray-500 underline"
          >
            Anuluj
          </button>
        </div>
      )}
    </div>
  );
}
