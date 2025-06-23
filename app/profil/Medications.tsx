import toast from "react-hot-toast";
import { Dispatch, SetStateAction } from "react";

interface MedicationsProps {
  norms: {
    medications?: string;
  };
  setNorms: Dispatch<SetStateAction<any>>;
}

export default function Medications({ norms, setNorms }: MedicationsProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <p className="font-semibold mb-4">
        Jakie leki obecnie przyjmujesz? (opcjonalne)
      </p>

      <textarea
        name="medications"
        value={norms.medications || ""}
        onChange={(e) =>
          setNorms((prev: any) => ({
            ...prev,
            medications: e.target.value,
          }))
        }
        rows={4}
        className="w-full border px-3 py-2 rounded-md"
        placeholder="np. Metformina, Bisoprolol, Insulina..."
      />

      <div className="mt-4 flex gap-4 flex-wrap">
        <button
          onClick={async () => {
            const meds = norms.medications?.trim();
            if (!meds) {
              toast.error("Wprowadź jakieś leki, zanim zapiszesz.");
              return;
            }

            const res = await fetch("/api/user/norms", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ medications: meds }),
            });

            if (res.ok) {
              toast.success("Zapisano informacje o lekach!");
            } else {
              toast.error("Wystąpił błąd przy zapisie.");
            }
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
        >
          💾 Zapisz leki
        </button>

        <button
          onClick={async () => {
            if (!norms.medications) {
              toast("Brak zapisanych leków do usunięcia.");
              return;
            }

            const res = await fetch("/api/user/norms", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ medications: null }),
            });

            if (res.ok) {
              setNorms((prev: any) => ({ ...prev, medications: "" }));
              toast.success("Usunięto wszystkie zapisane leki!");
            } else {
              toast.error("Nie udało się usunąć leków.");
            }
          }}
          className="text-red-600 hover:text-red-700 underline transition"
        >
          ❌ Usuń wszystkie leki
        </button>
      </div>
    </div>
  );
}
