"use client";

import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  Filler,
  CategoryScale,
} from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";
import type { AnnotationOptions } from "chartjs-plugin-annotation";
import { Line } from "react-chartjs-2";
import "chartjs-adapter-date-fns";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Container from "@/components/UI/Container/Container";
import Header from "@/components/UI/Headers/Header";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  Filler,
  CategoryScale,
  annotationPlugin
);

// Typy
type Measurement = {
  id: number;
  type: "ciśnienie" | "cukier" | "waga" | "tętno";
  createdAt: string;
  systolic?: number;
  diastolic?: number;
  amount?: number;
};

type Norms = {
  systolicMin?: number;
  systolicMax?: number;
  diastolicMin?: number;
  diastolicMax?: number;
  glucoseFastingMin?: number;
  glucoseFastingMax?: number;
  weightMin?: number;
  weightMax?: number;
  pulseMin?: number;
  pulseMax?: number;
};

type StatItem = {
  month: string;
  avg: number;
  min: number;
  max: number;
};

type PressureStatItem = {
  month: string;
  avgSystolic: number;
  avgDiastolic: number;
  minSystolic: number;
  maxSystolic: number;
  minDiastolic: number;
  maxDiastolic: number;
};

type Stats = {
  waga?: StatItem[];
  cukier?: StatItem[];
  tetno?: StatItem[];
  cisnienie?: PressureStatItem[];
};

export default function Statistics() {
  const { data: session } = useSession();
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [norms, setNorms] = useState<Norms | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      const fetchData = async () => {
        const [mRes, nRes, sRes] = await Promise.all([
          fetch("/api/measurement"),
          fetch("/api/user/norms"),
          fetch("/api/statistics"),
        ]);
        const measurements: Measurement[] = await mRes.json();
        const norms: Norms = await nRes.json();
        const stats: Stats = await sRes.json();
        setMeasurements(measurements);
        setNorms(norms);
        setStats(stats);
      };
      fetchData();
    }
  }, [session]);

  const prepareChartData = (type: Measurement["type"]) => {
    const filtered = measurements
      .filter((m) => m.type === type)
      .map((m) => ({
        date: new Date(m.createdAt),
        systolic: m.systolic ?? null,
        diastolic: m.diastolic ?? null,
        amount: m.amount ?? null,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const labels = filtered.map((m) => m.date.toISOString().split("T")[0]);

    let datasets;

    if (type === "ciśnienie") {
      datasets = [
        {
          label: "Skurczowe (mmHg)",
          data: filtered.map((m) => m.systolic),
          borderColor: "#4bc0c0",
          backgroundColor: "rgba(75, 192, 192, 0.1)",
          fill: false,
          tension: 0.3,
        },
        {
          label: "Rozkurczowe (mmHg)",
          data: filtered.map((m) => m.diastolic),
          borderColor: "#ff6384",
          backgroundColor: "rgba(255, 99, 132, 0.1)",
          fill: false,
          tension: 0.3,
        },
      ];
    } else if (type === "cukier") {
      datasets = [
        {
          label: "Glukoza (mg/dL)",
          data: filtered.map((m) => m.amount),
          borderColor: "#4bc0c0",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          tension: 0.3,
          fill: true,
        },
      ];
    } else if (type === "waga") {
      datasets = [
        {
          label: "Waga (kg)",
          data: filtered.map((m) => m.amount),
          borderColor: "#36a2eb",
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          tension: 0.3,
          fill: true,
        },
      ];
    } else if (type === "tętno") {
      datasets = [
        {
          label: "Tętno (bpm)",
          data: filtered.map((m) => m.amount),
          borderColor: "#f59e0b",
          backgroundColor: "rgba(245, 158, 11, 0.2)",
          tension: 0.3,
          fill: true,
        },
      ];
    }

    return { labels, datasets: datasets ?? [] };
  };

  const getAnnotations = (type: Measurement["type"]) => {
    if (!norms) return {};

    const lines: Record<string, AnnotationOptions> = {};

    if (type === "ciśnienie") {
      lines.systolicMin = {
        type: "line",
        yMin: norms.systolicMin,
        yMax: norms.systolicMin,
        borderColor: "#4bc0c0",
        borderDash: [6, 4],
        label: { content: "Skurczowe min", position: "start" },
      };
      lines.systolicMax = {
        type: "line",
        yMin: norms.systolicMax,
        yMax: norms.systolicMax,
        borderColor: "#4bc0c0",
        borderDash: [6, 4],
        label: { content: "Skurczowe max", position: "start" },
      };
      lines.diastolicMin = {
        type: "line",
        yMin: norms.diastolicMin,
        yMax: norms.diastolicMin,
        borderColor: "#ff6384",
        borderDash: [6, 4],
        label: { content: "Rozkurczowe min", position: "start" },
      };
      lines.diastolicMax = {
        type: "line",
        yMin: norms.diastolicMax,
        yMax: norms.diastolicMax,
        borderColor: "#ff6384",
        borderDash: [6, 4],
        label: { content: "Rozkurczowe max", position: "start" },
      };
    }

    if (type === "cukier") {
      lines.glucoseMin = {
        type: "line",
        yMin: norms.glucoseFastingMin,
        yMax: norms.glucoseFastingMin,
        borderColor: "#999",
        borderDash: [6, 4],
        label: { content: "Glukoza min", position: "start" },
      };
      lines.glucoseMax = {
        type: "line",
        yMin: norms.glucoseFastingMax,
        yMax: norms.glucoseFastingMax,
        borderColor: "#999",
        borderDash: [6, 4],
        label: { content: "Glukoza max", position: "start" },
      };
    }

    if (type === "waga") {
      lines.weightMin = {
        type: "line",
        yMin: norms.weightMin,
        yMax: norms.weightMin,
        borderColor: "#999",
        borderDash: [6, 4],
        label: { content: "Waga min", position: "start" },
      };
      lines.weightMax = {
        type: "line",
        yMin: norms.weightMax,
        yMax: norms.weightMax,
        borderColor: "#999",
        borderDash: [6, 4],
        label: { content: "Waga max", position: "start" },
      };
    }

    if (type === "tętno") {
      lines.pulseMin = {
        type: "line",
        yMin: norms.pulseMin,
        yMax: norms.pulseMin,
        borderColor: "#f59e0b",
        borderDash: [6, 4],
        label: { content: "Tętno min", position: "start" },
      };
      lines.pulseMax = {
        type: "line",
        yMin: norms.pulseMax,
        yMax: norms.pulseMax,
        borderColor: "#f59e0b",
        borderDash: [6, 4],
        label: { content: "Tętno max", position: "start" },
      };
    }

    return lines;
  };

  const baseOptions = (type: Measurement["type"]) => ({
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      tooltip: { mode: "index" as const, intersect: false },
      annotation: { annotations: getAnnotations(type) },
    },
    scales: {
      y: { beginAtZero: false },
    },
  });

  return (
    <Container>
      <Header text="Statystyki zdrowia" />
      <div className="grid md:grid-cols-2 gap-6 my-8 mt-10">
        {["ciśnienie", "cukier", "waga", "tętno"].map((type) => (
          <div key={type} className="bg-white p-4 rounded-xl shadow-2xl h-full">
            <h3 className="font-bold text-lg mb-4 capitalize">{type}</h3>
            <div className="h-55 xl:h-85">
              <Line
                data={prepareChartData(type as Measurement["type"])}
                options={baseOptions(type as Measurement["type"])}
              />
              <div className="mt-4 space-y-1 text-sm text-gray-700">
                {type === "waga" &&
                  stats?.waga?.map((item) => (
                    <p key={item.month}>
                      📅 {item.month} — Średnia:{" "}
                      <strong>{item.avg.toFixed(1)}</strong> kg, Min: {item.min}
                      , Max: {item.max}
                    </p>
                  ))}
                {type === "cukier" &&
                  stats?.cukier?.map((item) => (
                    <p key={item.month}>
                      📅 {item.month} — Średnia:{" "}
                      <strong>{item.avg.toFixed(1)}</strong> mg/dL, Min:{" "}
                      {item.min}, Max: {item.max}
                    </p>
                  ))}
                {type === "ciśnienie" &&
                  stats?.cisnienie?.map((item) => (
                    <p key={item.month}>
                      📅 {item.month} — Śr.:{" "}
                      <strong>
                        {item.avgSystolic.toFixed(0)}/
                        {item.avgDiastolic.toFixed(0)}
                      </strong>{" "}
                      mmHg, Min: {item.minSystolic}/{item.minDiastolic}, Max:{" "}
                      {item.maxSystolic}/{item.maxDiastolic}
                    </p>
                  ))}
                {type === "tętno" &&
                  stats?.tetno?.map((item) => (
                    <p key={item.month}>
                      📅 {item.month} — Średnia:{" "}
                      <strong>{item.avg.toFixed(1)}</strong> bpm, Min:{" "}
                      {item.min}, Max: {item.max}
                    </p>
                  ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}
