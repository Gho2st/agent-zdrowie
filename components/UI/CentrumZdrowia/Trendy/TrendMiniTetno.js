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
import useHealthChartData from "@/app/hooks/useHealthChartData";
import annotationPlugin from "chartjs-plugin-annotation";

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

export default function TrendMiniTetno({ refreshKey }) {
  const { prepared } = useHealthChartData("tętno", refreshKey);



  // Przygotowanie etykiet (Daty)
  const labels = prepared.map((m) => m.date.toISOString().slice(5, 10));

  // Przygotowanie danych (Wartości)
  const data = prepared.map((m) => m.value);

  // Renderowanie wykresu tętna
  return (
    <div className="bg-white/30 rounded-xl shadow p-4">
      <h4 className="font-semibold text-sm mb-2">❤️ Tętno – ostatnie 7 dni</h4>
      <div className="h-40 xl:h-95">
        <Line
          data={{
            labels,
            datasets: [
              {
                label: "Tętno",
                data,
                fill: true,
                borderColor: "#ec4899",
                backgroundColor: "rgba(236, 72, 153, 0.2)",
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
                // Opcjonalnie: Sugerowane min/max dla tętna, żeby wykres był czytelniejszy
                suggestedMin: 50,
                suggestedMax: 100,
              },
              x: { ticks: { maxTicksLimit: 5 } },
            },
          }}
        />
      </div>
    </div>
  );
}
