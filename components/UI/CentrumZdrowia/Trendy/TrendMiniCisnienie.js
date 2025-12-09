"use client";

import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
} from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";
import { Line } from "react-chartjs-2";
import { useEffect, useState } from "react";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  annotationPlugin
);

export default function TrendMiniCisnienie({ refreshKey }) {
  const [data, setData] = useState([]);
  const effectiveRefreshKey = refreshKey ?? "initial";

  // Pobieranie i przetwarzanie danych ciśnienia z API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/measurement");
        if (!res.ok) return;
        const measurements = await res.json();

        const cisnienieData = measurements
          // 1. NAPRAWA: Filtrujemy po nowym Enumie (BLOOD_PRESSURE) LUB starej nazwie
          .filter((m) => m.type === "BLOOD_PRESSURE" || m.type === "ciśnienie")
          .sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )
          .slice(-7)
          .map((m) => ({
            date: new Date(m.createdAt).toISOString().slice(5, 10),
            // 2. NAPRAWA: Jeśli API nie zwraca 'systolic', bierzemy 'value'
            systolic: m.systolic ?? m.value,
            // 3. NAPRAWA: Jeśli API nie zwraca 'diastolic', bierzemy 'value2'
            diastolic: m.diastolic ?? m.value2,
          }));

        setData(cisnienieData);
      } catch (err) {
        console.error("Błąd ładowania wykresu ciśnienia:", err);
      }
    };

    fetchData();
  }, [effectiveRefreshKey]);

  // Renderowanie wykresu ciśnienia (bez zmian)
  return (
    <div className="bg-white/30 rounded-xl shadow p-4">
      <h4 className="font-semibold text-sm mb-2">
        💓 Ciśnienie – ostatnie 7 dni
      </h4>
      <div className="h-40 xl:h-95">
        <Line
          data={{
            labels: data.map((m) => m.date),
            datasets: [
              {
                data: data.map((m) => m.systolic),
                label: "Skurczowe",
                borderColor: "#3b82f6",
                backgroundColor: "rgba(59, 130, 246, 0.2)",
                fill: false,
                tension: 0.3,
              },
              {
                data: data.map((m) => m.diastolic),
                label: "Rozkurczowe",
                borderColor: "#ef4444",
                backgroundColor: "rgba(239, 68, 68, 0.2)",
                fill: false,
                tension: 0.3,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: "top" },
              annotation: { annotations: {} },
            },
            scales: {
              y: { beginAtZero: false },
              x: { ticks: { maxTicksLimit: 5 } },
            },
          }}
        />
      </div>
    </div>
  );
}
