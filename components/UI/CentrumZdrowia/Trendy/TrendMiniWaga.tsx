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
} from "chart.js";
import useHealthChartData from "@/app/hooks/useHealthChartData";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler
);

export default function TrendMiniWaga({ refreshKey }: { refreshKey?: number }) {
  const { prepared } = useHealthChartData("waga", refreshKey);
  console.log("prepared waga:", prepared);

  const labels = prepared
    .slice()
    .reverse()
    .map((m) => m.date.toISOString().slice(5, 10));
  const data = prepared
    .slice()
    .reverse()
    .map((m) => m.value);

  return (
    <div className="bg-white/30 rounded-xl shadow p-4">
      <h4 className="font-semibold text-sm mb-2">⚖️ Waga – ostatnie 7 dni</h4>
      <div className="h-40 xl:h-95">
        <Line
          data={{
            labels,
            datasets: [
              {
                label: "Waga",
                data,
                fill: true,
                borderColor: "#4bc0c0",
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                tension: 0.3,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
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
