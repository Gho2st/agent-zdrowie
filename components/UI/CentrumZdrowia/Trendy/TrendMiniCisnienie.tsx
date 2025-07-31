"use client";

import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useEffect, useState } from "react";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
);

interface CisnienieData {
  date: string;
  systolic: number;
  diastolic: number;
}

interface Measurement {
  type: string;
  createdAt: string;
  systolic: number;
  diastolic: number;
}

export default function TrendMiniCisnienie() {
  const [data, setData] = useState<CisnienieData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("/api/measurement");
      const measurements: Measurement[] = await res.json();

      const cisnienieData = measurements
        .filter((m) => m.type === "ciśnienie")
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
        .slice(-7)
        .map((m) => ({
          date: new Date(m.createdAt).toISOString().slice(5, 10),
          systolic: m.systolic,
          diastolic: m.diastolic,
        }));

      setData(cisnienieData);
    };

    fetchData();
  }, []);

  return (
    <div className="bg-white/30 rounded-xl shadow p-4 w-full max-w-full overflow-x-auto">
      <h4 className="font-semibold text-sm mb-2">
        💓 Ciśnienie – ostatnie 7 dni
      </h4>
      <div
        className="relative w-full"
        style={{ height: "160px", minWidth: "300px" }}
      >
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
              legend: {
                position: "top",
                labels: {
                  boxWidth: 12,
                  font: { size: 10 },
                },
              },
            },
            scales: {
              y: {
                beginAtZero: false,
                ticks: {
                  font: { size: 10 },
                },
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
