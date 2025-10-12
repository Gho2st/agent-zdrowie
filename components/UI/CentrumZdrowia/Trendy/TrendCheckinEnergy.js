"use client";

// Importowanie komponentu Line z react-chartjs-2
import { Line } from "react-chartjs-2";
// Importowanie potrzebnych komponentów Chart.js
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
// Importowanie wtyczki adnotacji
import annotationPlugin from "chartjs-plugin-annotation";
// Importowanie hooka do pobierania trendów
import useCheckinTrends from "@/app/hooks/useCheckinTrends";

// Rejestracja komponentów Chart.js i wtyczki adnotacji
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

// Definicja typów dla emoji (konwersja z TypeScript na komentarze)
/* Typy dla snu: "🛌 Dobrze spałem" | "😴 Średnio" | "😵 Prawie nie spałem" */
/* Typy dla stresu: "😌 Niski" | "😬 Średni" | "😣 Wysoki" */
/* Typy dla energii: "⚡️ Wysoka" | "🔋 Średnia" | "🪫 Niska" */

export default function TrendCheckinEnergy({ refreshKey }) {
  // Pobieranie trendów za pomocą hooka
  const { trends } = useCheckinTrends(refreshKey);

  // Sprawdzenie, czy dane istnieją
  if (!trends || trends.length === 0) return null;

  // Tworzenie etykiet na podstawie dat
  const labels = trends.map((m) => new Date(m.date).toISOString().slice(5, 10));

  // Mapowanie wartości snu na liczby
  const sleepMap = {
    "🛌 Dobrze spałem": 3,
    "😴 Średnio": 2,
    "😵 Prawie nie spałem": 1,
  };

  // Mapowanie wartości stresu na liczby
  const stressMap = {
    "😌 Niski": 3,
    "😬 Średni": 2,
    "😣 Wysoki": 1,
  };

  // Mapowanie wartości energii na liczby
  const energyMap = {
    "⚡️ Wysoka": 3,
    "🔋 Średnia": 2,
    "🪫 Niska": 1,
  };

  // Przygotowanie danych dla snu
  const sleepData = trends.map((m) =>
    m.sleep && sleepMap[m.sleep] !== undefined ? sleepMap[m.sleep] : 0
  );

  // Przygotowanie danych dla stresu
  const stressData = trends.map((m) =>
    m.stress && stressMap[m.stress] !== undefined ? stressMap[m.stress] : 0
  );

  // Przygotowanie danych dla energii
  const energyData = trends.map((m) =>
    m.energy && energyMap[m.energy] !== undefined ? energyMap[m.energy] : 0
  );

  // Renderowanie komponentu z wykresem
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
              annotation: {
                annotations: {},
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
                    return labels[val] || val;
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
