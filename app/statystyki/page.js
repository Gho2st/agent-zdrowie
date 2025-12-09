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

// Konfiguracja mapowania: Nazwa sekcji -> Enum z Bazy -> Klucz w obiekcie stats
const CONFIG = {
  ciśnienie: {
    dbType: "BLOOD_PRESSURE",
    statsKey: "cisnienie",
    label: "Ciśnienie",
  },
  cukier: {
    dbType: "GLUCOSE",
    statsKey: "cukier",
    label: "Glukoza",
  },
  waga: {
    dbType: "WEIGHT",
    statsKey: "waga",
    label: "Waga",
  },
  tętno: {
    dbType: "HEART_RATE",
    statsKey: "tetno",
    label: "Tętno",
  },
};

export default function Statistics() {
  const { data: session } = useSession();
  const [measurements, setMeasurements] = useState([]);
  const [norms, setNorms] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (session?.user?.id) {
      const fetchData = async () => {
        try {
          const [mRes, nRes, sRes] = await Promise.all([
            fetch("/api/measurement"),
            fetch("/api/user/norms"),
            fetch("/api/statistics"),
          ]);

          const measurementsData = mRes.ok ? await mRes.json() : [];
          // Normy mogą być zagnieżdżone w { user: ... } zależnie od endpointu,
          // ale tutaj zakładamy, że GET /api/user/norms zwraca spłaszczony obiekt lub { user: norms }
          const normsData = nRes.ok ? await nRes.json() : null;
          const statsData = sRes.ok ? await sRes.json() : null;

          setMeasurements(measurementsData);
          // Bezpieczne wyciągnięcie norm
          setNorms(normsData?.user || normsData || null);
          setStats(statsData);
        } catch (error) {
          console.error("Błąd ładowania statystyk:", error);
        }
      };
      fetchData();
    }
  }, [session]);

  const prepareChartData = (category) => {
    const config = CONFIG[category];
    if (!config) return { labels: [], datasets: [] };

    const filtered = measurements
      .filter((m) => m.type === config.dbType) // Filtrujemy po Enumie (np. BLOOD_PRESSURE)
      .map((m) => ({
        date: new Date(m.createdAt),
        // Mapujemy nowe pola value/value2 na logiczne nazwy
        value: m.value, // Waga, Cukier, Tętno, Sys
        value2: m.value2, // Dia
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const labels = filtered.map((m) => m.date);
    let datasets = [];

    if (category === "ciśnienie") {
      datasets = [
        {
          label: "Skurczowe (mmHg)",
          data: filtered.map((m) => m.value), // value = systolic
          borderColor: "#4bc0c0",
          backgroundColor: "rgba(75, 192, 192, 0.1)",
          fill: false,
          tension: 0.3,
        },
        {
          label: "Rozkurczowe (mmHg)",
          data: filtered.map((m) => m.value2), // value2 = diastolic
          borderColor: "#ff6384",
          backgroundColor: "rgba(255, 99, 132, 0.1)",
          fill: false,
          tension: 0.3,
        },
      ];
    } else if (category === "cukier") {
      datasets = [
        {
          label: "Glukoza (mg/dL)",
          data: filtered.map((m) => m.value),
          borderColor: "#4bc0c0",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          tension: 0.3,
          fill: true,
        },
      ];
    } else if (category === "waga") {
      datasets = [
        {
          label: "Waga (kg)",
          data: filtered.map((m) => m.value),
          borderColor: "#36a2eb",
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          tension: 0.3,
          fill: true,
        },
      ];
    } else if (category === "tętno") {
      datasets = [
        {
          label: "Tętno (bpm)",
          data: filtered.map((m) => m.value),
          borderColor: "#f59e0b",
          backgroundColor: "rgba(245, 158, 11, 0.2)",
          tension: 0.3,
          fill: true,
        },
      ];
    }

    // Mapowanie danych na format {x, y} dla Chart.js (TimeScale)
    if (labels.length > 0 && datasets.length > 0) {
      datasets = datasets.map((dataset) => ({
        ...dataset,
        data: dataset.data.map((val, index) => ({
          x: labels[index],
          y: val,
        })),
      }));
    }

    return { labels, datasets };
  };

  const getAnnotations = (category) => {
    if (!norms) return {};

    const lines = {};

    // Helper do linii
    const createLine = (yValue, color, labelContent) => ({
      type: "line",
      yMin: yValue,
      yMax: yValue,
      borderColor: color,
      borderDash: [6, 4],
      label: { content: labelContent, position: "start", enabled: true, z: 10 },
      scaleID: "y",
    });

    if (category === "ciśnienie") {
      if (norms.systolicMin)
        lines.sMin = createLine(norms.systolicMin, "#4bc0c0", "Sys min");
      if (norms.systolicMax)
        lines.sMax = createLine(norms.systolicMax, "#4bc0c0", "Sys max");
      if (norms.diastolicMin)
        lines.dMin = createLine(norms.diastolicMin, "#ff6384", "Dia min");
      if (norms.diastolicMax)
        lines.dMax = createLine(norms.diastolicMax, "#ff6384", "Dia max");
    }
    if (category === "cukier") {
      if (norms.glucoseFastingMin)
        lines.gMin = createLine(norms.glucoseFastingMin, "#999", "Min");
      if (norms.glucoseFastingMax)
        lines.gMax = createLine(norms.glucoseFastingMax, "#999", "Max");
    }
    if (category === "waga") {
      if (norms.weightMin)
        lines.wMin = createLine(norms.weightMin, "#999", "Min");
      if (norms.weightMax)
        lines.wMax = createLine(norms.weightMax, "#999", "Max");
    }
    if (category === "tętno") {
      if (norms.pulseMin)
        lines.pMin = createLine(norms.pulseMin, "#f59e0b", "Min");
      if (norms.pulseMax)
        lines.pMax = createLine(norms.pulseMax, "#f59e0b", "Max");
    }

    return lines;
  };

  const baseOptions = (category) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      tooltip: { mode: "index", intersect: false },
      annotation: { annotations: getAnnotations(category) },
    },
    scales: {
      y: { beginAtZero: false, type: "linear" },
      x: {
        type: "time",
        time: { unit: "day", tooltipFormat: "d.MM.yyyy" },
        title: { display: false },
      },
    },
  });

  if (!stats && measurements.length === 0) {
    return (
      <Container>
        <Header text="Statystyki zdrowia" />
        <div className="mt-10 text-center text-gray-500">
          Ładowanie danych...
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Header text="Statystyki zdrowia" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8 mt-10">
        {/* Iterujemy po kluczach konfiguracji */}
        {Object.keys(CONFIG).map((category) => {
          const config = CONFIG[category];
          const hasData = measurements.some((m) => m.type === config.dbType);
          const statData = stats ? stats[config.statsKey] : [];

          return (
            <div
              key={category}
              className="bg-white/30 backdrop-blur-lg border border-white/20 p-4 rounded-xl shadow-2xl h-full"
            >
              <h3 className="font-bold text-lg mb-4 capitalize">{category}</h3>
              <div className="space-y-4">
                {/* WYKRES */}
                <div className="relative h-[300px] sm:h-[400px] md:h-[500px]">
                  {hasData ? (
                    <Line
                      data={prepareChartData(category)}
                      options={baseOptions(category)}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                      Brak danych do wyświetlenia wykresu.
                    </div>
                  )}
                </div>

                {/* STATYSTYKI MIESIĘCZNE */}
                {/* Używamy config.statsKey, bo API zwraca klucze bez polskich znaków (np. 'tetno') */}
                <div className="text-sm text-gray-700 space-y-1 mt-4">
                  {statData && statData.length > 0 ? (
                    statData.map((item) => {
                      if (category === "ciśnienie") {
                        return (
                          <p key={item.month}>
                            📅 {item.month} — Śr.:{" "}
                            <strong>
                              {item.avgSystolic?.toFixed(0)}/
                              {item.avgDiastolic?.toFixed(0)}
                            </strong>{" "}
                            mmHg, Min: {item.minSystolic}/{item.minDiastolic},
                            Max: {item.maxSystolic}/{item.maxDiastolic}
                          </p>
                        );
                      }
                      // Dla pozostałych typów (waga, cukier, tętno) struktura jest taka sama
                      return (
                        <p key={item.month}>
                          📅 {item.month} — Średnia:{" "}
                          <strong>{item.avg?.toFixed(1)}</strong>, Min:{" "}
                          {item.min}, Max: {item.max}
                        </p>
                      );
                    })
                  ) : (
                    <p className="text-xs text-gray-400">
                      Brak statystyk miesięcznych
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Container>
  );
}
