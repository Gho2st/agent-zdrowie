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
import useCheckinTrends from "@/app/hooks/useCheckinTrends";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler,
  Legend
);

// Definiujemy dokładne typy stringów jako unie (dla bezpiecznego indeksowania)
type SleepEmoji = "🛌 Dobrze spałem" | "😴 Średnio" | "😵 Prawie nie spałem";
type StressEmoji = "😌 Niski" | "😬 Średni" | "😣 Wysoki";
type EnergyEmoji = "⚡️ Wysoka" | "🔋 Średnia" | "🪫 Niska";

export default function TrendCheckinEnergy() {
  const { trends } = useCheckinTrends();

  const labels = trends.map((m) => new Date(m.date).toISOString().slice(5, 10));

  const sleepMap: Record<SleepEmoji, number> = {
    "🛌 Dobrze spałem": 3,
    "😴 Średnio": 2,
    "😵 Prawie nie spałem": 1,
  };

  const stressMap: Record<StressEmoji, number> = {
    "😌 Niski": 3,
    "😬 Średni": 2,
    "😣 Wysoki": 1,
  };

  const energyMap: Record<EnergyEmoji, number> = {
    "⚡️ Wysoka": 3,
    "🔋 Średnia": 2,
    "🪫 Niska": 1,
  };

  const sleepData = trends.map((m) =>
    m.sleep && sleepMap[m.sleep as SleepEmoji] !== undefined
      ? sleepMap[m.sleep as SleepEmoji]
      : null
  );

  const stressData = trends.map((m) =>
    m.stress && stressMap[m.stress as StressEmoji] !== undefined
      ? stressMap[m.stress as StressEmoji]
      : null
  );

  const energyData = trends.map((m) =>
    m.energy && energyMap[m.energy as EnergyEmoji] !== undefined
      ? energyMap[m.energy as EnergyEmoji]
      : null
  );

  return (
    <div className="bg-white/30 rounded-xl shadow p-4">
      <h4 className="font-semibold text-sm mb-2">
        🔋 Energia vs 🌙 Sen i 😖 Stres – ostatnie 7 dni
      </h4>
      <div className="h-48">
        <Line
          data={{
            labels,
            datasets: [
              {
                label: "🌙 Sen",
                data: sleepData,
                fill: false,
                borderColor: "#3b82f6",
                tension: 0.3,
              },
              {
                label: "😖 Stres",
                data: stressData,
                fill: false,
                borderColor: "#ef4444",
                tension: 0.3,
              },
              {
                label: "🔋 Energia",
                data: energyData,
                fill: false,
                borderColor: "#10b981",
                tension: 0.3,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                labels: {
                  font: { size: 12 },
                },
              },
            },
            scales: {
              y: {
                min: 0,
                max: 3.5,
                ticks: {
                  stepSize: 1,
                  callback: (val) => {
                    const labels = ["", "Niski", "Średni", "Wysoki"];
                    return labels[val as number] || val;
                  },
                },
              },
              x: {
                ticks: {
                  font: { size: 10 },
                },
              },
            },
          }}
        />
      </div>
    </div>
  );
}
