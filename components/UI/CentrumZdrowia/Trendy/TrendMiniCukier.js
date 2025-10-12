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
import useHealthChartData from "@/app/hooks/useHealthChartData";

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

export default function TrendMiniCukier({ refreshKey }) {
  // Pobieranie danych glukozy za pomocą hooka
  const { prepared } = useHealthChartData("cukier", refreshKey);

  if (!prepared || prepared.length === 0) return null;

  // Przygotowanie etykiet na podstawie dat
  const labels = prepared
    .slice()
    .reverse()
    .map((m) => m.date.toISOString().slice(5, 10));

  // Przygotowanie danych glukozy
  const data = prepared
    .slice()
    .reverse()
    .map((m) => m.value);

  // Renderowanie wykresu glukozy
  return (
    <div className="bg-white/30 xl:h-full rounded-xl shadow p-4">
      <h4 className="font-semibold text-sm mb-2">
        🍭 Glukoza – ostatnie 7 dni
      </h4>
      <div className="h-40 xl:h-95">
        <Line
          data={{
            labels,
            datasets: [
              {
                label: "Glukoza",
                data,
                fill: true,
                borderColor: "#f59e0b",
                backgroundColor: "rgba(245, 158, 11, 0.2)",
                tension: 0.3,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
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
