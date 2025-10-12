"use client";

import { useEffect, useState } from "react";
import { Loader2, Info } from "lucide-react";

const typeIcons = {
  waga: "⚖️",
  cukier: "🍭",
  ciśnienie: "💓",
};

export default function OstatniePomiary() {
  const [dane, setDane] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pobieranie ostatnich pomiarów z API
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
      <div className="bg-white/30 p-6 rounded-xl shadow flex items-center justify-center h-[140px] animate-pulse">
        <Loader2 className="animate-spin mr-2" size={22} />
        Ładowanie ostatnich pomiarów...
      </div>
    );
  }

  if (dane.length === 0) {
    return (
      <div className="bg-white/30 p-6 rounded-xl shadow text-center flex flex-col items-center gap-2">
        <Info className="w-7 h-7" />
        <p className="text-lg">Nie masz jeszcze żadnych zapisanych pomiarów.</p>
        <p className="text-sm text-gray-500">
          Dodaj pierwszy pomiar, aby śledzić swoje zdrowie.
        </p>
      </div>
    );
  }

  // Renderowanie listy ostatnich pomiarów
  return (
    <div className="bg-white/30 p-6 rounded-2xl shadow">
      <h3 className="text-lg font-semibold mb-4">📈 Ostatnie pomiary</h3>
      <ul className="space-y-4">
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
          const opis =
            pomiar.type === "ciśnienie" && pomiar.systolic && pomiar.diastolic
              ? `${pomiar.systolic}/${pomiar.diastolic} ${
                  pomiar.unit || "mmHg"
                }`
              : `${pomiar.amount} ${pomiar.unit}`;

          return (
            <li
              key={pomiar.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-2"
            >
              <div className="text-gray-800">
                <span className="font-medium">{dataPomiaru}</span>
              </div>
              <div className="text-sm text-gray-700 mt-1 sm:mt-0">
                {icon} <span className="capitalize">{pomiar.type}</span>: {opis}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
