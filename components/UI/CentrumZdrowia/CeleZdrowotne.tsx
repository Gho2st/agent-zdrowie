"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

type Cele = {
  user: {
    weightMin: number | null;
    weightMax: number | null;
    systolicMin: number | null;
    systolicMax: number | null;
    glucoseFastingMin: number | null;
    glucoseFastingMax: number | null;
    pulseMin: number | null;
    pulseMax: number | null;
  };
  values: {
    weight: number | null;
    systolic: number | null;
    diastolic: number | null;
    glucose: number | null;
    pulse: number | null;
  };
};

export default function CeleZdrowotne() {
  const [data, setData] = useState<Cele | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCele = async () => {
      try {
        const res = await fetch("/api/cele-zdrowotne");
        const json = await res.json();
        if (!json.error) setData(json);
      } catch (err) {
        console.error("Błąd ładowania celów:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCele();
  }, []);

  if (loading)
    return (
      <div className="bg-white p-4 rounded-xl shadow mt-6 flex items-center justify-center text-gray-500 h-[120px]">
        <Loader2 className="animate-spin mr-2" size={20} />
        Ładowanie celów...
      </div>
    );
  if (!data) return <div className="text-gray-500">Brak danych o celach.</div>;

  const { user, values } = data;

  const inRange = (
    val: number | null,
    min: number | null,
    max: number | null
  ) => val !== null && min !== null && max !== null && val >= min && val <= max;

  const Zielony = "bg-green-50 border-green-200 text-green-800";
  const Czerwony = "bg-red-50 border-red-200 text-red-800";

  return (
    <div className="bg-white p-4 rounded-xl shadow mt-6">
      <h3 className="text-lg font-semibold mb-4">🎯 Cele zdrowotne</h3>

      <div className="grid gap-3 text-sm">
        {/* WAGA */}
        <div
          className={`rounded-lg border px-4 py-3 ${
            inRange(values.weight, user.weightMin, user.weightMax)
              ? Zielony
              : Czerwony
          }`}
        >
          <div className="font-medium flex justify-between items-center">
            ⚖️ Waga
            <span className="text-xs opacity-70">
              Cel: {user.weightMin}–{user.weightMax} kg
            </span>
          </div>
          <p className="mt-1 text-base font-bold">
            {values.weight !== null ? `${values.weight} kg` : "Brak pomiaru"}
          </p>
        </div>

        {/* CIŚNIENIE */}
        <div
          className={`rounded-lg border px-4 py-3 ${
            inRange(values.systolic, user.systolicMin, user.systolicMax)
              ? Zielony
              : Czerwony
          }`}
        >
          <div className="font-medium flex justify-between items-center">
            💓 Ciśnienie
            <span className="text-xs opacity-70">
              Cel: {user.systolicMin}–{user.systolicMax} mmHg
            </span>
          </div>
          <p className="mt-1 text-base font-bold">
            {values.systolic && values.diastolic
              ? `${values.systolic}/${values.diastolic} mmHg`
              : "Brak pomiaru"}
          </p>
        </div>

        {/* CUKIER */}
        <div
          className={`rounded-lg border px-4 py-3 ${
            inRange(
              values.glucose,
              user.glucoseFastingMin,
              user.glucoseFastingMax
            )
              ? Zielony
              : Czerwony
          }`}
        >
          <div className="font-medium flex justify-between items-center">
            🍭 Glukoza (na czczo)
            <span className="text-xs opacity-70">
              Cel: {user.glucoseFastingMin}–{user.glucoseFastingMax} mg/dL
            </span>
          </div>
          <p className="mt-1 text-base font-bold">
            {values.glucose !== null
              ? `${values.glucose} mg/dL`
              : "Brak pomiaru"}
          </p>
        </div>

        {/* TĘTNO */}
        <div
          className={`rounded-lg border px-4 py-3 ${
            inRange(values.pulse, user.pulseMin, user.pulseMax)
              ? Zielony
              : Czerwony
          }`}
        >
          <div className="font-medium flex justify-between items-center">
            ❤️ Tętno
            <span className="text-xs opacity-70">
              Cel: {user.pulseMin}–{user.pulseMax} bpm
            </span>
          </div>
          <p className="mt-1 text-base font-bold">
            {values.pulse !== null ? `${values.pulse} bpm` : "Brak pomiaru"}
          </p>
        </div>
      </div>
    </div>
  );
}
