"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

type Pomiar = {
  id: number;
  type: string;
  amount: string;
  unit: string;
  systolic?: number;
  diastolic?: number;
  createdAt: string;
};

const typeIcons: Record<string, string> = {
  waga: "⚖️",
  cukier: "🍭",
  ciśnienie: "❤️",
};

export default function OstatniePomiary() {
  const [dane, setDane] = useState<Pomiar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPomiary = async () => {
      try {
        const res = await fetch("/api/ostatnie-pomiary");
        const data = await res.json();
        if (!data.error) {
          setDane(data);
        }
      } catch (err) {
        console.error("Błąd ładowania pomiarów:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPomiary();
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-xl shadow mt-6 flex items-center justify-center text-gray-500 h-[120px]">
        <Loader2 className="animate-spin mr-2" size={20} />
        Ładowanie pomiarów...
      </div>
    );
  }

  if (dane.length === 0) {
    return (
      <div className="bg-white p-4 rounded-xl shadow text-center text-gray-500">
        Brak zapisanych pomiarów.
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-xl shadow mt-6">
      <h3 className="text-lg font-semibold mb-4">📈 Ostatnie pomiary</h3>
      <ul className="space-y-3">
        {dane.map((pomiar) => {
          const dataPomiaru = new Date(pomiar.createdAt).toLocaleString(
            "pl-PL",
            {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }
          );

          const icon = typeIcons[pomiar.type] || "🔹";
          let opis = "";

          if (
            pomiar.type === "ciśnienie" &&
            pomiar.systolic &&
            pomiar.diastolic
          ) {
            opis = `${pomiar.systolic}/${pomiar.diastolic} ${
              pomiar.unit || "mmHg"
            }`;
          } else {
            opis = `${pomiar.amount} ${pomiar.unit}`;
          }

          return (
            <li key={pomiar.id} className="text-gray-700">
              <span className="font-medium">{dataPomiaru}</span> – {icon}{" "}
              <span className="capitalize">{pomiar.type}</span>: {opis}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
