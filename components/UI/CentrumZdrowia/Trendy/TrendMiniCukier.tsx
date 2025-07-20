"use client";

import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useEffect, useState } from "react";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler
);

interface CukierData {
  date: string;
  value: number;
}

export default function TrendMiniCukier() {
  const [data, setData] = useState<CukierData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("/api/measurement");
      const measurements = await res.json();
      const cukierData = measurements
        .filter((m: { type: string }) => m.type === "cukier")
        .slice(-7)
        .map((m: { createdAt: string; amount: number }) => ({
          date: new Date(m.createdAt).toISOString().slice(5, 10),
          value: Number(m.amount),
        }));
      setData(cukierData);
    };
    fetchData();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <h4 className="font-semibold text-sm mb-2">
        🍭 Glukoza – ostatnie 7 dni
      </h4>
      <div className="h-40">
        <Line
          data={{
            labels: data.map((m) => m.date),
            datasets: [
              {
                data: data.map((m) => m.value),
                label: "Glukoza",
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
