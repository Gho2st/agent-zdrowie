"use client";

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
import { Line } from "react-chartjs-2";
import { useMemo } from "react";
import {
  Scale,
  Heart,
  Activity,
  Droplets,
  Zap,
  CalendarDays,
} from "lucide-react";

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

const hexToRgba = (hex, alpha) => {
  if (!hex) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const STYLE_CONFIG = {
  WEIGHT: {
    icon: Scale,
    colorClass: "bg-teal-50 text-teal-600",
    lineColor: "#0d9488",
    label: "Masa ciała",
  },
  GLUCOSE: {
    icon: Droplets,
    colorClass: "bg-amber-50 text-amber-600",
    lineColor: "#d97706",
    label: "Poziom cukru",
  },
  BLOOD_PRESSURE: {
    icon: Activity,
    colorClass: "bg-indigo-50 text-indigo-600",
    lineColor: "#4f46e5",
    label: "Ciśnienie krwi",
  },
  HEART_RATE: {
    icon: Heart,
    colorClass: "bg-rose-50 text-rose-600",
    lineColor: "#e11d48",
    label: "Tętno",
  },
  CHECKIN: {
    icon: Zap,
    colorClass: "bg-blue-50 text-blue-600",
    lineColor: "#2563eb",
    label: "Samopoczucie",
  },
  DEFAULT: {
    icon: CalendarDays,
    colorClass: "bg-gray-50 text-gray-600",
    lineColor: "#4b5563",
    label: "Wykres",
  },
};

export default function TrendMini({ data = [], type, title }) {
  const isCheckin = type === "CHECKIN";
  const isPressure = type === "BLOOD_PRESSURE" || type === "ciśnienie";

  const configType =
    Object.keys(STYLE_CONFIG).find((key) => key === type) || "DEFAULT";
  const style = STYLE_CONFIG[configType];
  const Icon = style.icon;

  const chartData = useMemo(() => {
    const processed = data
      .map((m) => {
        try {
          const dateObj = new Date(m.createdAt || m.date);
          if (isNaN(dateObj.getTime())) return null;
          return { dateObj, ...m };
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .filter((m) => {
        if (isCheckin) return true;
        const itemType = m.type?.toUpperCase();
        const targetType = type?.toUpperCase();
        return itemType === targetType;
      })
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
      .slice(-7)
      .map((m) => ({
        date: m.dateObj.toISOString().slice(5, 10),
        value: Number(m.value ?? m.amount ?? m.systolic ?? 0),
        value2: m.value2 ?? m.diastolic ?? null,
        sleep: m.sleep,
        stress: m.stress,
        energy: m.energy,
      }));

    return processed;
  }, [data, type, isCheckin]);

  if (chartData.length === 0) {
    return (
      <div className="bg-white border border-gray-200 p-6 rounded-3xl flex flex-col h-full items-center justify-center min-h-[200px] text-gray-400">
        <Icon
          className={`w-10 h-10 mb-2 opacity-50 ${
            style.colorClass.split(" ")[1]
          }`}
        />
        <p className="text-sm">Brak danych z ostatnich 7 dni</p>
      </div>
    );
  }

  const labels = chartData.map((d) => d.date);
  let datasets = [];
  let optionsScalesY = {};

  if (isCheckin) {
    datasets = [
      {
        label: "🌙 Sen",
        data: chartData.map((d) => d.sleep),
        borderColor: "#3b82f6",
        borderWidth: 2,
        pointBackgroundColor: "#fff",
        pointBorderColor: "#3b82f6",
        pointRadius: 4,
        tension: 0.4,
      },
      {
        label: "😖 Stres",
        data: chartData.map((d) => d.stress),
        borderColor: "#ef4444",
        borderWidth: 2,
        pointBackgroundColor: "#fff",
        pointBorderColor: "#ef4444",
        pointRadius: 4,
        tension: 0.4,
      },
      {
        label: "🔋 Energia",
        data: chartData.map((d) => d.energy),
        borderColor: "#10b981",
        borderWidth: 2,
        pointBackgroundColor: "#fff",
        pointBorderColor: "#10b981",
        pointRadius: 4,
        tension: 0.4,
      },
    ];
    optionsScalesY = {
      min: 0,
      max: 4,
      grid: { color: "#f3f4f6", borderDash: [5, 5] },
      border: { display: false },
      ticks: {
        font: { size: 10, family: "'Inter', sans-serif" },
        color: "#9ca3af",
        stepSize: 1,
        callback: (val) => {
          if (val === 1) return "Źle";
          if (val === 2) return "Średnio";
          if (val === 3) return "Dobrze";
          return "";
        },
      },
    };
  } else if (isPressure) {
    datasets = [
      {
        label: "Skurczowe",
        data: chartData.map((d) => d.value),
        borderColor: "#4f46e5",
        backgroundColor: "rgba(79, 70, 229, 0.1)",
        fill: true,
        borderWidth: 2,
        pointRadius: 3,
        tension: 0.4,
      },
      {
        label: "Rozkurczowe",
        data: chartData.map((d) => d.value2),
        borderColor: "#ec4899",
        backgroundColor: "rgba(236, 72, 153, 0.1)",
        fill: true,
        borderWidth: 2,
        pointRadius: 3,
        tension: 0.4,
      },
    ];
    optionsScalesY = {
      beginAtZero: false,
      grid: { color: "#f3f4f6", borderDash: [5, 5] },
      border: { display: false },
      ticks: { color: "#9ca3af", font: { size: 10 } },
    };
  } else {
    datasets = [
      {
        label: title || style.label,
        data: chartData.map((d) => d.value),
        borderColor: style.lineColor,
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          if (!ctx) return hexToRgba(style.lineColor, 0.2);

          const gradient = ctx.createLinearGradient(0, 0, 0, 200);
          gradient.addColorStop(0, hexToRgba(style.lineColor, 0.4));
          gradient.addColorStop(1, hexToRgba(style.lineColor, 0.0));
          return gradient;
        },
        fill: true,
        borderWidth: 2,
        pointBackgroundColor: "#fff",
        pointBorderColor: style.lineColor,
        pointRadius: 4,
        tension: 0.4,
      },
    ];
    optionsScalesY = {
      beginAtZero: false,
      grid: { color: "#f3f4f6", borderDash: [5, 5] },
      border: { display: false },
      ticks: { color: "#9ca3af", font: { size: 10 } },
    };
  }

  return (
    <div className="bg-white border border-gray-200 p-6 rounded-3xl flex flex-col h-full w-full">
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-200">
        <div className={`p-3 rounded-2xl ${style.colorClass}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Ostatnie 7 dni
          </p>
          <p className="text-xl font-bold text-gray-800 leading-tight">
            {title
              ? title
                  .replace(
                    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
                    ""
                  )
                  .trim()
              : style.label}
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-[160px] relative w-full">
        <Line
          data={{ labels, datasets }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: isPressure || isCheckin,
                position: "bottom",
                align: "start",
                labels: {
                  usePointStyle: true,
                  boxWidth: 8,
                  padding: 20,
                  font: { size: 11, family: "'Inter', sans-serif" },
                  color: "#6b7280",
                },
              },
              tooltip: {
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                titleColor: "#111827",
                bodyColor: "#4b5563",
                borderColor: "#e5e7eb",
                borderWidth: 1,
                cornerRadius: 8,
                padding: 10,
                displayColors: true,
                boxPadding: 4,
              },
              annotation: { annotations: {} },
            },
            scales: {
              y: optionsScalesY,
              x: {
                grid: { display: false },
                border: { display: false },
                ticks: {
                  maxTicksLimit: 5,
                  font: { size: 10 },
                  color: "#9ca3af",
                },
              },
            },
          }}
        />
      </div>
    </div>
  );
}
