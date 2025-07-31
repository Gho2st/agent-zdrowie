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

export default function TrendMiniWaga() {
  const { prepared } = useHealthChartData("waga");

  const labels = prepared
    .slice()
    .reverse()
    .map((m) => m.date.toISOString().slice(5, 10));
  const data = prepared
    .slice()
    .reverse()
    .map((m) => m.value);

  return (
    <div className="bg-white/30 rounded-xl shadow p-4 w-full max-w-full overflow-x-auto">
      <h4 className="font-semibold text-sm mb-2">⚖️ Waga – ostatnie 7 dni</h4>
      <div
        className="relative w-full"
        style={{ height: "160px", minWidth: "300px" }}
      >
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
              y: {
                beginAtZero: false,
                ticks: { font: { size: 10 } },
              },
              x: {
                ticks: {
                  maxTicksLimit: 5,
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
