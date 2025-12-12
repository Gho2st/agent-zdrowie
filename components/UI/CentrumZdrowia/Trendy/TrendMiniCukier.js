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
// Upewnij się, że ścieżka do hooka jest poprawna
import useHealthChartData from "@/app/hooks/useHealthChartData";

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
  // Przekazujemy "cukier", a zaktualizowany hook zamieni to na "GLUCOSE"
  const { prepared } = useHealthChartData("cukier", refreshKey);


  // Przygotowanie etykiet (data)
  const labels = prepared.map((m) => m.date.toISOString().slice(5, 10));

  // Przygotowanie wartości (glukoza)
  const data = prepared.map((m) => m.value);

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
              y: {
                beginAtZero: false,
                // Opcjonalnie: sugerowany zakres dla cukru, żeby wykres nie skakał drastycznie
                suggestedMin: 60,
                suggestedMax: 140,
              },
              x: { ticks: { maxTicksLimit: 5 } },
            },
          }}
        />
      </div>
    </div>
  );
}
