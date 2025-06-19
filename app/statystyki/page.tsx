"use client";

import { Line } from "react-chartjs-2";
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
  const [filterType, setFilterType] = useState("ciśnienie");

  useEffect(() => {
    if (session?.user?.id) {
      const fetchData = async () => {
        const [mRes, nRes] = await Promise.all([
          fetch("/api/measurement"),
          fetch("/api/user/norms"),
        ]);
        const measurements = await mRes.json();
        const norms = await nRes.json();
        setMeasurements(measurements);
        setNorms(norms);
      };
      fetchData();
    }
  }, [session]);

  const filtered = measurements
    .filter((m: any) => m.type === filterType)
    .map((m: any) => ({
      date: new Date(m.createdAt),
      systolic: m.systolic ? Number(m.systolic) : null,
      diastolic: m.diastolic ? Number(m.diastolic) : null,
      amount: m.amount ? Number(m.amount) : null,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const labels = filtered.map((m) => m.date.toISOString().split("T")[0]);

  const getDataset = () => {
    if (filterType === "ciśnienie") {
      return [
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
    }

    return [
      {
        label: filterType === "cukier" ? "Cukier (mg/dL)" : "Waga (kg)",
        data: filtered.map((m) => m.amount),
        borderColor: "#4bc0c0",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.3,
        fill: true,
      },
    ];
  };

  const chartData = {
    labels,
    datasets: getDataset(),
  };

  const getAnnotations = () => {
    if (!norms) return {};

    const lines: any = {};

    if (filterType === "ciśnienie") {
      lines.systolicMin = {
        type: "line",
        yMin: norms.systolicMin,
        yMax: norms.systolicMin,
        borderColor: "#4bc0c0",
        borderDash: [6, 4],
        label: {
          content: "Skurczowe min",
          enabled: true,
          position: "start",
        },
      };
      lines.systolicMax = {
        type: "line",
        yMin: norms.systolicMax,
        yMax: norms.systolicMax,
        borderColor: "#4bc0c0",
        borderDash: [6, 4],
        label: {
          content: "Skurczowe max",
          enabled: true,
          position: "start",
        },
      };
      lines.diastolicMin = {
        type: "line",
        yMin: norms.diastolicMin,
        yMax: norms.diastolicMin,
        borderColor: "#ff6384",
        borderDash: [6, 4],
        label: {
          content: "Rozkurczowe min",
          enabled: true,
          position: "start",
        },
      };
      lines.diastolicMax = {
        type: "line",
        yMin: norms.diastolicMax,
        yMax: norms.diastolicMax,
        borderColor: "#ff6384",
        borderDash: [6, 4],
        label: {
          content: "Rozkurczowe max",
          enabled: true,
          position: "start",
        },
      };
    }

    if (filterType === "cukier") {
      lines.glucoseMin = {
        type: "line",
        yMin: norms.glucoseMin,
        yMax: norms.glucoseMin,
        borderColor: "#999",
        borderDash: [6, 4],
        label: {
          content: "Glukoza min",
          enabled: true,
          position: "start",
        },
      };
      lines.glucoseMax = {
        type: "line",
        yMin: norms.glucoseMax,
        yMax: norms.glucoseMax,
        borderColor: "#999",
        borderDash: [6, 4],
        label: {
          content: "Glukoza max",
          enabled: true,
          position: "start",
        },
      };
    }

    if (filterType === "waga") {
      lines.weightMin = {
        type: "line",
        yMin: norms.weightMin,
        yMax: norms.weightMin,
        borderColor: "#999",
        borderDash: [6, 4],
        label: {
          content: "Waga min",
          enabled: true,
          position: "start",
        },
      };
      lines.weightMax = {
        type: "line",
        yMin: norms.weightMax,
        yMax: norms.weightMax,
        borderColor: "#999",
        borderDash: [6, 4],
        label: {
          content: "Waga max",
          enabled: true,
          position: "start",
        },
      };
    }

    return lines;
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
      },
      annotation: {
        annotations: getAnnotations(),
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  return (
    <Container>
      <Header text="Statystyki zdrowia" />
      <div className="my-6 max-w-md mx-auto">
        <label className="block mb-2 font-medium">Typ pomiaru</label>
        <select
          className="w-full border rounded p-2"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="ciśnienie">Ciśnienie</option>
          <option value="cukier">Cukier</option>
          <option value="waga">Waga</option>
        </select>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-xl">
        <Line data={chartData} options={chartOptions} />
      </div>
    </Container>
  );
}
