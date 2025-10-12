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

          // Dodajemy proste sprawdzenie ok, by uniknąć problemów z .json()
          const measurements = mRes.ok ? await mRes.json() : [];
          const norms = nRes.ok ? await nRes.json() : null;
          const stats = sRes.ok ? await sRes.json() : null;

          setMeasurements(measurements);
          setNorms(norms);
          setStats(stats);
        } catch (error) {
          console.error("Błąd ładowania statystyk:", error);
          // Można dodać toast.error tutaj, jeśli jest to potrzebne
        }
      };
      fetchData();
    }
  }, [session]);

  const prepareChartData = (type) => {
    const filtered = measurements
      .filter((m) => m.type === type)
      .map((m) => ({
        date: new Date(m.createdAt),
        systolic: m.systolic ?? null,
        diastolic: m.diastolic ?? null,
        amount: m.amount ?? null,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Używamy date-fns adaptera, więc data powinna być obiektem Date lub ISO stringiem.
    // Używanie tylko daty bez czasu ('T')[0]) może powodować problemy z TimeScale,
    // ale zachowujemy oryginalną logikę mapowania na stringa, aby była zgodna z ChartJS adapterem
    // jeśli ten oczekuje czystego stringa daty dla lepszej prezentacji na osi X.
    const labels = filtered.map((m) => m.date);

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

    // W Chart.js TimeScale działa najlepiej, gdy dane są w formacie {x: data, y: wartość}.
    // Zmieniamy strukturę danych dla lepszej kompatybilności z TimeScale, jeśli `labels` to daty.
    if (labels.length > 0 && datasets && datasets.length > 0) {
      datasets = datasets.map((dataset) => ({
        ...dataset,
        data: dataset.data.map((amount, index) => ({
          x: labels[index], // Data jako oś X
          y: amount,
        })),
      }));
    }

    return { labels: labels, datasets: datasets ?? [] };
  };

  const getAnnotations = (type) => {
    if (!norms) return {};

    const lines = {};

    // Funkcja pomocnicza do tworzenia linii normy
    const createLine = (id, yValue, color, labelContent) => ({
      type: "line",
      yMin: yValue,
      yMax: yValue,
      borderColor: color,
      borderDash: [6, 4],
      label: { content: labelContent, position: "start", enabled: true, z: 10 },
      scaleID: "y",
    });

    if (type === "ciśnienie") {
      if (norms.systolicMin)
        lines.systolicMin = createLine(
          "systolicMin",
          norms.systolicMin,
          "#4bc0c0",
          "Skurczowe min"
        );
      if (norms.systolicMax)
        lines.systolicMax = createLine(
          "systolicMax",
          norms.systolicMax,
          "#4bc0c0",
          "Skurczowe max"
        );
      if (norms.diastolicMin)
        lines.diastolicMin = createLine(
          "diastolicMin",
          norms.diastolicMin,
          "#ff6384",
          "Rozkurczowe min"
        );
      if (norms.diastolicMax)
        lines.diastolicMax = createLine(
          "diastolicMax",
          norms.diastolicMax,
          "#ff6384",
          "Rozkurczowe max"
        );
    }

    if (type === "cukier") {
      if (norms.glucoseFastingMin)
        lines.glucoseMin = createLine(
          "glucoseMin",
          norms.glucoseFastingMin,
          "#999",
          "Glukoza min"
        );
      if (norms.glucoseFastingMax)
        lines.glucoseMax = createLine(
          "glucoseMax",
          norms.glucoseFastingMax,
          "#999",
          "Glukoza max"
        );
    }

    if (type === "waga") {
      if (norms.weightMin)
        lines.weightMin = createLine(
          "weightMin",
          norms.weightMin,
          "#999",
          "Waga min"
        );
      if (norms.weightMax)
        lines.weightMax = createLine(
          "weightMax",
          norms.weightMax,
          "#999",
          "Waga max"
        );
    }

    if (type === "tętno") {
      if (norms.pulseMin)
        lines.pulseMin = createLine(
          "pulseMin",
          norms.pulseMin,
          "#f59e0b",
          "Tętno min"
        );
      if (norms.pulseMax)
        lines.pulseMax = createLine(
          "pulseMax",
          norms.pulseMax,
          "#f59e0b",
          "Tętno max"
        );
    }

    return lines;
  };

  const baseOptions = (type) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      tooltip: { mode: "index", intersect: false },
      annotation: { annotations: getAnnotations(type) },
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

  // Jeśli dane się ładują, nie renderujemy wykresów
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
        {["ciśnienie", "cukier", "waga", "tętno"].map((type) => (
          <div
            key={type}
            className="bg-white/30 backdrop-blur-lg border border-white/20 p-4 rounded-xl shadow-2xl h-full"
          >
            <h3 className="font-bold text-lg mb-4 capitalize">{type}</h3>
            <div className="space-y-4">
              {/* Kontener dla wykresu */}
              <div className="relative h-[300px] sm:h-[400px] md:h-[500px]">
                {measurements.filter((m) => m.type === type).length > 0 ? (
                  <Line
                    data={prepareChartData(type)}
                    options={baseOptions(type)}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                    Brak danych do wyświetlenia wykresu.
                  </div>
                )}
              </div>

              {/* Statystyki miesięczne */}
              <div className="text-sm text-gray-700 space-y-1 mt-4">
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
