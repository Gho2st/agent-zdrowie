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

export default function Statistics() {
  const { data: session } = useSession();
  const [measurements, setMeasurements] = useState([]);
  const [norms, setNorms] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (session?.user?.id) {
      const fetchData = async () => {
        const [mRes, nRes, sRes] = await Promise.all([
          fetch("/api/measurement"),
          fetch("/api/user/norms"),
          fetch("/api/statistics"),
        ]);
        const measurements = await mRes.json();
        const norms = await nRes.json();
        const stats = await sRes.json();
        setMeasurements(measurements);
        setNorms(norms);
        setStats(stats);
      };
      fetchData();
    }
  }, [session]);

  const prepareChartData = (type: string) => {
    const filtered = measurements
      .filter((m: any) => m.type === type)
      .map((m: any) => ({
        date: new Date(m.createdAt),
        systolic: m.systolic ? Number(m.systolic) : null,
        diastolic: m.diastolic ? Number(m.diastolic) : null,
        amount: m.amount ? Number(m.amount) : null,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const labels = filtered.map((m) => m.date.toISOString().split("T")[0]);

    let datasets: any = [];

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
    } else {
      datasets = [
        {
          label: type === "cukier" ? "Glukoza (mg/dL)" : "Waga (kg)",
          data: filtered.map((m) => m.amount),
          borderColor: "#4bc0c0",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          tension: 0.3,
          fill: true,
        },
      ];
    }

    return {
      labels,
      datasets,
    };
  };

  const getAnnotations = (type: string) => {
    if (!norms) return {};

    const lines: any = {};

    if (type === "ciśnienie") {
      lines.systolicMin = {
        type: "line",
        yMin: norms.systolicMin,
        yMax: norms.systolicMin,
        borderColor: "#4bc0c0",
        borderDash: [6, 4],
        label: { content: "Skurczowe min", enabled: true, position: "start" },
      };
      lines.systolicMax = {
        type: "line",
        yMin: norms.systolicMax,
        yMax: norms.systolicMax,
        borderColor: "#4bc0c0",
        borderDash: [6, 4],
        label: { content: "Skurczowe max", enabled: true, position: "start" },
      };
      lines.diastolicMin = {
        type: "line",
        yMin: norms.diastolicMin,
        yMax: norms.diastolicMin,
        borderColor: "#ff6384",
        borderDash: [6, 4],
        label: { content: "Rozkurczowe min", enabled: true, position: "start" },
      };
      lines.diastolicMax = {
        type: "line",
        yMin: norms.diastolicMax,
        yMax: norms.diastolicMax,
        borderColor: "#ff6384",
        borderDash: [6, 4],
        label: { content: "Rozkurczowe max", enabled: true, position: "start" },
      };
    }

    if (type === "cukier") {
      lines.glucoseMin = {
        type: "line",
        yMin: norms.glucoseFastingMin,
        yMax: norms.glucoseFastingMin,
        borderColor: "#999",
        borderDash: [6, 4],
        label: { content: "Glukoza min", enabled: true, position: "start" },
      };
      lines.glucoseMax = {
        type: "line",
        yMin: norms.glucoseFastingMax,
        yMax: norms.glucoseFastingMax,
        borderColor: "#999",
        borderDash: [6, 4],
        label: { content: "Glukoza max", enabled: true, position: "start" },
      };
    }

    if (type === "waga") {
      lines.weightMin = {
        type: "line",
        yMin: norms.weightMin,
        yMax: norms.weightMin,
        borderColor: "#999",
        borderDash: [6, 4],
        label: { content: "Waga min", enabled: true, position: "start" },
      };
      lines.weightMax = {
        type: "line",
        yMin: norms.weightMax,
        yMax: norms.weightMax,
        borderColor: "#999",
        borderDash: [6, 4],
        label: { content: "Waga max", enabled: true, position: "start" },
      };
    }

    return lines;
  };

  const baseOptions = (type: string) => ({
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      tooltip: { mode: "index" as const, intersect: false },
      annotation: { annotations: getAnnotations(type) },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  });

  return (
    <Container>
      <Header text="Statystyki zdrowia" />
      <div className="grid md:grid-cols-2 gap-6 my-8 mt-10">
        {["ciśnienie", "cukier", "waga"].map((type) => (
          <div key={type} className="bg-white p-4 rounded-xl shadow-2xl h-full">
            <h3 className="font-bold text-lg mb-4 capitalize">{type}</h3>
            <Line
              data={prepareChartData(type)}
              options={baseOptions(type)}
              height={300}
            />
            <div className="mt-4 space-y-1 text-sm text-gray-700">
              {type === "waga" &&
                stats?.waga?.map((item: any) => (
                  <p key={item.month}>
                    📅 {item.month} — Średnia:{" "}
                    <strong>{item.avg.toFixed(1)}</strong> kg, Min: {item.min},
                    Max: {item.max}
                  </p>
                ))}

              {type === "cukier" &&
                stats?.cukier?.map((item: any) => (
                  <p key={item.month}>
                    📅 {item.month} — Średnia:{" "}
                    <strong>{item.avg.toFixed(1)}</strong> mg/dL, Min:{" "}
                    {item.min}, Max: {item.max}
                  </p>
                ))}

              {type === "ciśnienie" &&
                stats?.cisnienie?.map((item: any) => (
                  <p key={item.month}>
                    📅 {item.month} — Śr.:{" "}
                    <strong>
                      {item.avgSystolic?.toFixed(0)}/
                      {item.avgDiastolic?.toFixed(0)}
                    </strong>{" "}
                    mmHg, Min: {item.minSystolic}/{item.minDiastolic}, Max:{" "}
                    {item.maxSystolic}/{item.maxDiastolic}
                  </p>
                ))}
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}
