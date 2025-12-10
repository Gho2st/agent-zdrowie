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
import { ArrowDown, ArrowUp, Activity, Percent } from "lucide-react";

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
    color: "blue",
  },
  cukier: {
    dbType: "GLUCOSE",
    label: "Glukoza",
    unit: "mg/dL",
    color: "teal",
  },
  waga: {
    dbType: "WEIGHT",
    label: "Waga",
    unit: "kg",
    color: "cyan",
  },
  tętno: {
    dbType: "HEART_RATE",
    label: "Tętno",
    unit: "bpm",
    color: "amber",
  },
};

// Helper: Sprawdza czy wartość jest w normie
const checkIsNormal = (val, val2, type, norms) => {
  if (!norms) return null;
  if (type === "ciśnienie") {
    // Dla ciśnienia oba muszą być w normie
    const sOk =
      val >= (norms.systolicMin || 0) && val <= (norms.systolicMax || 999);
    const dOk =
      val2 >= (norms.diastolicMin || 0) && val2 <= (norms.diastolicMax || 999);
    return sOk && dOk;
  }
  if (type === "cukier") {
    // Uproszczenie: sprawdzamy ogólny zakres (np. na czczo max)
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
  const { data: session } = useSession();
  const [measurements, setMeasurements] = useState([]);
  const [norms, setNorms] = useState(null);
  const [timeRange, setTimeRange] = useState("30"); // 7, 30, 90, all

  useEffect(() => {
    if (session?.user?.id) {
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
        }
      };
      fetchData();
    }
  }, [session]);

  // --- OBLICZANIE STATYSTYK W LOCIE ---
  const getStats = (category) => {
    const config = CONFIG[category];
    const now = new Date();

    // 1. Filtrowanie po typie i dacie
    const filtered = measurements.filter((m) => {
      if (m.type !== config.dbType) return false;
      if (timeRange === "all") return true;
      const date = new Date(m.createdAt);
      const diffDays = (now - date) / (1000 * 60 * 60 * 24);
      return diffDays <= Number(timeRange);
    });

    if (filtered.length === 0) return null;

    // 2. Wyciąganie wartości
    const values1 = filtered.map((m) => m.value); // Sys, Waga, Cukier
    const values2 =
      category === "ciśnienie" ? filtered.map((m) => m.value2) : [];

    // 3. Obliczenia matematyczne
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

    // 4. Analiza Norm (% poprawnych wyników)
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

  // --- PRZYGOTOWANIE DANYCH DO WYKRESU I NORM (Adnotacji) ---
  const prepareChartData = (category, data) => {
    const labels = data.map((m) => new Date(m.createdAt));
    let datasets = [];
    let annotations = {};

    // 1. DANE (datasets)
    if (category === "ciśnienie") {
      datasets = [
        {
          label: "Skurczowe",
          data: data.map((m) => ({ x: new Date(m.createdAt), y: m.value })),
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          tension: 0.3,
          pointRadius: 4,
        },
        {
          label: "Rozkurczowe",
          data: data.map((m) => ({ x: new Date(m.createdAt), y: m.value2 })),
          borderColor: "#ef4444",
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          tension: 0.3,
          pointRadius: 4,
        },
      ];
    } else {
      // Kolory dla reszty
      const color =
        category === "cukier"
          ? "#14b8a6"
          : category === "waga"
          ? "#06b6d4"
          : "#f59e0b";
      datasets = [
        {
          label: CONFIG[category].label,
          data: data.map((m) => ({ x: new Date(m.createdAt), y: m.value })),
          borderColor: color,
          backgroundColor: color + "20", // przezroczystość
          fill: true,
          tension: 0.3,
          pointRadius: 4,
        },
      ];
    }

    // 2. NORMY (annotations) - Użycie stref tła (box) dla czytelności
    const NORM_COLOR = "rgba(16, 185, 129, 0.1)"; // Jasnozielony dla strefy normy

    if (norms) {
      if (category === "ciśnienie" && norms.systolicMin && norms.systolicMax) {
        // Strefa normy dla ciśnienia skurczowego (Górna linia)
        annotations.systolicNormArea = {
          type: "box",
          yMin: norms.systolicMin,
          yMax: norms.systolicMax,
          backgroundColor: NORM_COLOR,
          borderWidth: 0,
          label: {
            content: "Norma Skurczowe",
            enabled: true,
            position: "end",
            backgroundColor: "rgba(16, 185, 129, 0.5)",
            yAdjust: 10,
          },
        };

        // Strefa normy dla ciśnienia rozkurczowego (Dolna linia)
        if (norms.diastolicMin && norms.diastolicMax) {
          annotations.diastolicNormArea = {
            type: "box",
            yMin: norms.diastolicMin,
            yMax: norms.diastolicMax,
            backgroundColor: NORM_COLOR,
            borderWidth: 0,
            label: {
              content: "Norma Rozkurczowe",
              enabled: true,
              position: "start",
              backgroundColor: "rgba(16, 185, 129, 0.5)",
              yAdjust: -10,
            },
          };
        }
      } else if (
        category === "cukier" &&
        norms.glucoseFastingMin &&
        norms.glucosePostMealMax
      ) {
        // Norma dla Cukru (jedna strefa)
        annotations.glucoseNormArea = {
          type: "box",
          yMin: norms.glucoseFastingMin,
          yMax: norms.glucosePostMealMax,
          backgroundColor: NORM_COLOR,
          borderWidth: 0,
        };
      } else if (category === "waga" && norms.weightMin && norms.weightMax) {
        // Norma dla Wagi (jedna strefa)
        annotations.weightNormArea = {
          type: "box",
          yMin: norms.weightMin,
          yMax: norms.weightMax,
          backgroundColor: NORM_COLOR,
          borderWidth: 0,
        };
      } else if (category === "tętno" && norms.pulseMin && norms.pulseMax) {
        // Norma dla Tętna (jedna strefa)
        annotations.pulseNormArea = {
          type: "box",
          yMin: norms.pulseMin,
          yMax: norms.pulseMax,
          backgroundColor: NORM_COLOR,
          borderWidth: 0,
        };
      }
    }

    return { labels, datasets, annotations };
  };

  // --- OPCJE WYKRESU Z OBSŁUGĄ ANNOTATIONS ---
  const getChartOptions = (annotations) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: "index", intersect: false },
      annotation: {
        // Dodajemy konfigurację dla pluginu annotations
        annotations: annotations,
      },
    },
    scales: {
      x: {
        type: "time",
        time: {
          unit: timeRange === "7" ? "day" : "month",
          displayFormats: { day: "d MMM", month: "MMM" },
        },
        grid: { display: false },
      },
      y: {
        beginAtZero: false,
      },
    },
  });

  if (measurements.length === 0) {
    return (
      <Container>
        <Header text="Statystyki" />
        <p className="mt-10 text-center text-gray-500">Brak danych...</p>
      </Container>
    );
  }

  return (
    <Container>
      <Header text="Szczegółowe Statystyki" />

      {/* Przełącznik Czasu */}
      <div className="flex justify-center gap-2 mt-6 mb-8">
        {[
          { label: "7 dni", val: "7" },
          { label: "30 dni", val: "30" },
          { label: "90 dni", val: "90" },
          { label: "Wszystko", val: "all" },
        ].map((opt) => (
          <button
            key={opt.val}
            onClick={() => setTimeRange(opt.val)}
            className={`px-4 py-1.5 text-sm rounded-full transition-all ${
              timeRange === opt.val
                ? "bg-blue-600 text-white shadow-md font-medium"
                : "bg-white text-gray-600 border hover:bg-gray-50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {Object.keys(CONFIG).map((category) => {
          const stats = getStats(category);
          const config = CONFIG[category];

          if (!stats) return null; // Ukryj, jeśli brak danych w tym okresie

          // Pobierz dane i adnotacje
          const chartData = prepareChartData(category, stats.dataForChart);

          return (
            <div
              key={category}
              className="bg-white/40 backdrop-blur-md border border-white/30 rounded-2xl shadow-lg p-6 flex flex-col h-full"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  {category === "ciśnienie" && "💓"}
                  {category === "cukier" && "🍭"}
                  {category === "waga" && "⚖️"}
                  {category === "tętno" && "❤️"}
                  {config.label}
                </h3>
                <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-500">
                  {stats.count} pomiarów
                </span>
              </div>

              {/* STATYSTYKI W KAFELKACH */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <StatCard
                  label="Średnia"
                  value={stats.avg}
                  unit={config.unit}
                  icon={<Activity className="w-3 h-3" />}
                />
                <StatCard
                  label="Minimum"
                  value={stats.min}
                  unit={config.unit}
                  icon={<ArrowDown className="w-3 h-3" />}
                />
                <StatCard
                  label="Maksimum"
                  value={stats.max}
                  unit={config.unit}
                  icon={<ArrowUp className="w-3 h-3" />}
                />
                <StatCard
                  label="W normie"
                  value={`${stats.normPercentage}%`}
                  unit=""
                  color={
                    stats.normPercentage > 80
                      ? "text-green-600"
                      : "text-amber-600"
                  }
                  icon={<Percent className="w-3 h-3" />}
                />
              </div>

              {/* WYKRES */}
              <div className="grow min-h-[250px] bg-white/50 rounded-xl p-2 border border-white/20">
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

// Mini komponent do kafelków
function StatCard({ label, value, unit, icon, color = "text-gray-800" }) {
  return (
    <div className="bg-white/60 p-3 rounded-xl border border-white/40 shadow-sm flex flex-col justify-center">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-gray-500 mb-1">
        {icon} {label}
      </div>
      <div className={`font-bold text-lg leading-none ${color}`}>
        {value}
        <span className="text-[10px] text-gray-400 ml-1 font-normal">
          {unit}
        </span>
      </div>
    </div>
  );
}
