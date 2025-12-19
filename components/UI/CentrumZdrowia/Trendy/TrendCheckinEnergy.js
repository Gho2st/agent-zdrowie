"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";
import useCheckinTrends from "@/app/hooks/useCheckinTrends";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler,
  Legend,
  annotationPlugin
);

export default function TrendCheckinEnergy({ refreshKey }) {
  const { trends } = useCheckinTrends(refreshKey);

  if (!trends || trends.length === 0) return null;

  const labels = trends.map((m) => new Date(m.date).toISOString().slice(5, 10));

  const sleepData = trends.map((m) => m.sleep ?? null);
  const stressData = trends.map((m) => m.stress ?? null);
  const energyData = trends.map((m) => m.energy ?? null);

  return (
    <div className="bg-white/30 rounded-xl shadow p-4">
      <h4 className="font-semibold text-sm mb-2">
        🔋 Energia vs 🌙 Sen i 😖 Stres – ostatnie 7 dni
      </h4>
      <div className="h-40 xl:h-95">
        <Line
          data={{
            labels,
            datasets: [
              {
                label: "🌙 Sen (1-3)",
                data: sleepData,
                fill: false,
                borderColor: "#3b82f6",
                tension: 0.3,
              },
              {
                label: "😖 Stres (1-3)",
                data: stressData,
                fill: false,
                borderColor: "#ef4444", // Czerwony dla stresu
                tension: 0.3,
              },
              {
                label: "🔋 Energia (1-3)",
                data: energyData,
                fill: false,
                borderColor: "#10b981", // Zielony dla energii
                tension: 0.3,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                labels: { font: { size: 12 } },
              },
              tooltip: {
                callbacks: {
                  // Wyświetlanie etykiet tekstowych w dymku po najechaniu
                  label: (context) => {
                    const val = context.raw;
                    let label = context.dataset.label || "";
                    let text = "";

                    if (val === 1) text = "Niski / Słaby";
                    if (val === 2) text = "Średni";
                    if (val === 3) text = "Wysoki / Dobry";

                    return `${label}: ${text} (${val})`;
                  },
                },
              },
            },
            scales: {
              y: {
                min: 0,
                max: 4, // Zwiększyłem lekko zakres, żeby kropki nie były ucięte
                ticks: {
                  stepSize: 1,
                  // Mapowanie liczb na osi Y na słowa
                  callback: (val) => {
                    if (val === 1) return "Niski / Źle";
                    if (val === 2) return "Średni";
                    if (val === 3) return "Wysoki / Dobrze";
                    return "";
                  },
                },
              },
              x: {
                ticks: { font: { size: 10 } },
              },
            },
          }}
        />
      </div>
    </div>
  );
}
