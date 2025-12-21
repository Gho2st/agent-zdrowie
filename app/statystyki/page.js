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
import {
  ArrowDown,
  ArrowUp,
  Activity,
  Percent,
  BarChart3,
  CalendarRange,
} from "lucide-react";

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

const CONFIG = {
  ciśnienie: {
    dbType: "BLOOD_PRESSURE",
    label: "Ciśnienie",
    unit: "mmHg",
    color: "#4f46e5",
    bg: "rgba(79, 70, 229, 0.1)",
    iconBg: "bg-indigo-50",
    iconText: "text-indigo-600",
  },
  cukier: {
    dbType: "GLUCOSE",
    label: "Glukoza",
    unit: "mg/dL",
    color: "#d97706",
    bg: "rgba(245, 158, 11, 0.1)",
    iconBg: "bg-amber-50",
    iconText: "text-amber-600",
  },
  waga: {
    dbType: "WEIGHT",
    label: "Masa ciała",
    unit: "kg",
    color: "#0d9488",
    bg: "rgba(13, 148, 136, 0.1)",
    iconBg: "bg-teal-50",
    iconText: "text-teal-600",
  },
  tętno: {
    dbType: "HEART_RATE",
    label: "Tętno",
    unit: "bpm",
    color: "#e11d48",
    bg: "rgba(225, 29, 72, 0.1)",
    iconBg: "bg-rose-50",
    iconText: "text-rose-600",
  },
};

const checkIsNormal = (val, val2, type, norms) => {
  if (!norms) return null;
  if (type === "ciśnienie") {
    const sOk =
      val >= (norms.systolicMin || 0) && val <= (norms.systolicMax || 999);
    const dOk =
      val2 >= (norms.diastolicMin || 0) && val2 <= (norms.diastolicMax || 999);
    return sOk && dOk;
  }
  if (type === "cukier") {
    return (
      val <= (norms.glucosePostMealMax || 180) &&
      val >= (norms.glucoseFastingMin || 60)
    );
  }
  if (type === "waga") {
    return val >= (norms.weightMin || 0) && val <= (norms.weightMax || 999);
  }
  if (type === "tętno") {
    return val >= (norms.pulseMin || 0) && val <= (norms.pulseMax || 999);
  }
  return true;
};

export default function Statistics() {
  const { data: status } = useSession();
  const [measurements, setMeasurements] = useState([]);
  const [norms, setNorms] = useState(null);
  const [timeRange, setTimeRange] = useState("30");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      const fetchData = async () => {
        try {
          const [mRes, nRes] = await Promise.all([
            fetch("/api/measurement"),
            fetch("/api/user/norms"),
          ]);
          setMeasurements(mRes.ok ? await mRes.json() : []);
          const nData = nRes.ok ? await nRes.json() : null;
          setNorms(nData?.user || nData || null);
        } catch (error) {
          console.error("Błąd danych:", error);
        } finally {
          setTimeout(() => setLoading(false), 300);
        }
      };
      fetchData();
    }
  }, [status]);

  const getStats = (category) => {
    const config = CONFIG[category];
    const now = new Date();

    const filtered = measurements.filter((m) => {
      if (m.type !== config.dbType) return false;
      if (timeRange === "all") return true;
      const date = new Date(m.createdAt);
      const diffDays = (now - date) / (1000 * 60 * 60 * 24);
      return diffDays <= Number(timeRange);
    });

    if (filtered.length === 0) return null;

    const values1 = filtered.map((m) => m.value);
    const values2 =
      category === "ciśnienie" ? filtered.map((m) => m.value2) : [];

    const avg1 = values1.reduce((a, b) => a + b, 0) / values1.length;
    const min1 = Math.min(...values1);
    const max1 = Math.max(...values1);

    let avg2 = 0,
      min2 = 0,
      max2 = 0;
    if (category === "ciśnienie") {
      avg2 = values2.reduce((a, b) => a + b, 0) / values2.length;
      min2 = Math.min(...values2);
      max2 = Math.max(...values2);
    }

    const inNormCount = filtered.filter((m) =>
      checkIsNormal(m.value, m.value2, category, norms)
    ).length;
    const normPercentage = Math.round((inNormCount / filtered.length) * 100);

    return {
      count: filtered.length,
      avg:
        category === "ciśnienie"
          ? `${avg1.toFixed(0)}/${avg2.toFixed(0)}`
          : avg1.toFixed(1),
      min: category === "ciśnienie" ? `${min1}/${min2}` : min1,
      max: category === "ciśnienie" ? `${max1}/${max2}` : max1,
      normPercentage,
      dataForChart: filtered.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      ),
    };
  };

  const prepareChartData = (category, data) => {
    const labels = data.map((m) => new Date(m.createdAt));
    let datasets = [];
    let annotations = {};
    const config = CONFIG[category];

    if (category === "ciśnienie") {
      datasets = [
        {
          label: "Skurczowe",
          data: data.map((m) => ({ x: new Date(m.createdAt), y: m.value })),
          borderColor: "#4f46e5", // Indigo
          backgroundColor: "rgba(79, 70, 229, 0.1)",
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 6,
          fill: true,
        },
        {
          label: "Rozkurczowe",
          data: data.map((m) => ({ x: new Date(m.createdAt), y: m.value2 })),
          borderColor: "#ec4899", // Pink
          backgroundColor: "rgba(236, 72, 153, 0.1)",
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 6,
          fill: true,
        },
      ];
    } else {
      datasets = [
        {
          label: config.label,
          data: data.map((m) => ({ x: new Date(m.createdAt), y: m.value })),
          borderColor: config.color,
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, config.color + "40"); // 25% opacity
            gradient.addColorStop(1, config.color + "00"); // 0% opacity
            return gradient;
          },
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: "#fff",
          pointBorderColor: config.color,
          borderWidth: 2,
        },
      ];
    }

    const NORM_COLOR = "rgba(16, 185, 129, 0.08)";
    const BORDER_COLOR = "rgba(16, 185, 129, 0.3)";

    if (norms) {
      if (category === "ciśnienie" && norms.systolicMin) {
        annotations.systolicNorm = {
          type: "box",
          yMin: norms.systolicMin,
          yMax: norms.systolicMax,
          backgroundColor: NORM_COLOR,
          borderColor: BORDER_COLOR,
          borderWidth: 1,
          borderDash: [5, 5],
        };
        if (norms.diastolicMin) {
          annotations.diastolicNorm = {
            type: "box",
            yMin: norms.diastolicMin,
            yMax: norms.diastolicMax,
            backgroundColor: NORM_COLOR,
            borderColor: BORDER_COLOR,
            borderWidth: 1,
            borderDash: [5, 5],
          };
        }
      } else if (category === "cukier" && norms.glucoseFastingMin) {
        annotations.normArea = {
          type: "box",
          yMin: norms.glucoseFastingMin,
          yMax: norms.glucosePostMealMax,
          backgroundColor: NORM_COLOR,
          borderColor: BORDER_COLOR,
          borderWidth: 1,
          borderDash: [5, 5],
        };
      } else if (category === "waga" && norms.weightMin) {
        annotations.normArea = {
          type: "box",
          yMin: norms.weightMin,
          yMax: norms.weightMax,
          backgroundColor: NORM_COLOR,
          borderColor: BORDER_COLOR,
          borderWidth: 1,
          borderDash: [5, 5],
        };
      } else if (category === "tętno" && norms.pulseMin) {
        annotations.normArea = {
          type: "box",
          yMin: norms.pulseMin,
          yMax: norms.pulseMax,
          backgroundColor: NORM_COLOR,
          borderColor: BORDER_COLOR,
          borderWidth: 1,
          borderDash: [5, 5],
        };
      }
    }

    return { labels, datasets, annotations };
  };

  const getChartOptions = (annotations) => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        titleColor: "#1f2937",
        bodyColor: "#4b5563",
        borderColor: "#e5e7eb",
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        displayColors: true,
        usePointStyle: true,
      },
      annotation: {
        annotations: annotations,
      },
    },
    scales: {
      x: {
        type: "time",
        time: {
          unit: timeRange === "7" ? "day" : "month",
          displayFormats: { day: "d MMM", month: "MMM" },
          tooltipFormat: "d MMM yyyy",
        },
        grid: { display: false },
        ticks: {
          font: { size: 10 },
          color: "#9ca3af",
          maxTicksLimit: 6,
        },
        border: { display: false },
      },
      y: {
        beginAtZero: false,
        grid: {
          color: "#f3f4f6",
          borderDash: [5, 5],
        },
        border: { display: false },
        ticks: {
          font: { size: 10 },
          color: "#9ca3af",
          maxTicksLimit: 5,
        },
      },
    },
  });

  if (loading || status === "loading") {
    return (
      <Container>
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gray-200 animate-pulse" />
          <div className="space-y-2">
            <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>

        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-16 h-8 bg-gray-200 rounded-full animate-pulse"
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white/80 backdrop-blur-xl border border-white/40 p-6 rounded-3xl h-[450px] shadow-sm animate-pulse"
            >
              <div className="flex justify-between mb-6">
                <div className="h-6 w-32 bg-gray-200 rounded" />
                <div className="h-5 w-16 bg-gray-200 rounded" />
              </div>
              <div className="grid grid-cols-4 gap-3 mb-6">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-16 bg-gray-200 rounded-xl" />
                ))}
              </div>
              <div className="h-[250px] bg-gray-200 rounded-xl" />
            </div>
          ))}
        </div>
      </Container>
    );
  }

  if (measurements.length === 0) {
    return (
      <Container>
        <Header text="Statystyki" />
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-4 bg-gray-100 rounded-full mb-4">
            <BarChart3 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-700">
            Brak danych do analizy
          </h3>
          <p className="text-gray-500 max-w-sm mt-2">
            Dodaj swoje pierwsze pomiary, aby zobaczyć tutaj szczegółowe wykresy
            i analizy trendów.
          </p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="flex items-center gap-4 mb-8 pb-4 border-b border-gray-100">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-sm ring-1 ring-blue-100">
          <BarChart3 className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Analiza
          </p>
          <h1 className="text-2xl font-bold text-gray-800 leading-none">
            Szczegółowe Statystyki
          </h1>
        </div>
      </div>

      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-gray-100/50 p-1.5 rounded-2xl border border-gray-200/50 shadow-sm">
          {[
            { label: "7 dni", val: "7" },
            { label: "30 dni", val: "30" },
            { label: "3 mies.", val: "90" },
            { label: "Całość", val: "all" },
          ].map((opt) => (
            <button
              key={opt.val}
              onClick={() => setTimeRange(opt.val)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-300 ${
                timeRange === opt.val
                  ? "bg-white text-blue-600 shadow-sm scale-105 ring-1 ring-black/5"
                  : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {Object.keys(CONFIG).map((category) => {
          const stats = getStats(category);
          const config = CONFIG[category];

          if (!stats) return null;

          const chartData = prepareChartData(category, stats.dataForChart);

          return (
            <div
              key={category}
              className="bg-white/80 backdrop-blur-xl border border-white/40 p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200/50 flex flex-col h-full hover:shadow-2xl transition-shadow duration-500"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl ${config.iconBg} ${config.iconText}`}
                  >
                    {category === "ciśnienie" && (
                      <Activity className="w-5 h-5" />
                    )}
                    {category === "cukier" && <Percent className="w-5 h-5" />}
                    {category === "waga" && <BarChart3 className="w-5 h-5" />}
                    {category === "tętno" && <Activity className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 leading-tight">
                      {config.label}
                    </h3>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      {config.unit}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-lg">
                  <CalendarRange className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs font-semibold text-gray-600">
                    {stats.count}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                <StatCard
                  label="Średnia"
                  value={stats.avg}
                  icon={<Activity className="w-3.5 h-3.5" />}
                />
                <StatCard
                  label="Min"
                  value={stats.min}
                  color="text-emerald-600"
                  icon={<ArrowDown className="w-3.5 h-3.5" />}
                />
                <StatCard
                  label="Max"
                  value={stats.max}
                  color="text-rose-600"
                  icon={<ArrowUp className="w-3.5 h-3.5" />}
                />
                <StatCard
                  label="W normie"
                  value={`${stats.normPercentage}%`}
                  color={
                    stats.normPercentage > 80
                      ? "text-emerald-600"
                      : "text-amber-600"
                  }
                  icon={<Percent className="w-3.5 h-3.5" />}
                />
              </div>

              <div className="grow min-h-[280px] w-full relative">
                <Line
                  data={chartData}
                  options={getChartOptions(chartData.annotations)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Container>
  );
}

function StatCard({ label, value, icon, color = "text-gray-800" }) {
  return (
    <div className="bg-white/50 hover:bg-white p-3 rounded-2xl border border-white/60 shadow-sm transition-all duration-300 group">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 group-hover:text-gray-500 transition-colors">
        {icon} {label}
      </div>
      <div className={`font-black text-lg leading-none ${color}`}>{value}</div>
    </div>
  );
}
