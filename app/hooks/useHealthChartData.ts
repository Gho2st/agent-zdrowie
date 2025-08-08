import { useEffect, useState } from "react";

interface Measurement {
  createdAt: string;
  type: string;
  amount?: string;
  systolic?: number;
  diastolic?: number;
}

interface Norms {
  systolicMin?: number;
  systolicMax?: number;
  diastolicMin?: number;
  diastolicMax?: number;
  glucoseFastingMin?: number;
  glucoseFastingMax?: number;
  weightMin?: number;
  weightMax?: number;
}

export interface PreparedData {
  date: Date;
  value: number | [number, number];
}

export default function useHealthChartData(type: string, refreshKey?: number) {
  const [data, setData] = useState<Measurement[]>([]);
  const [norms, setNorms] = useState<Norms | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mRes, nRes] = await Promise.all([
          fetch("/api/measurement"),
          fetch("/api/user/norms"),
        ]);

        if (!mRes.ok || !nRes.ok) {
          throw new Error("Błąd pobierania danych");
        }

        const measurements: Measurement[] = await mRes.json();
        const normsData: Norms = await nRes.json();

        if (!Array.isArray(measurements)) {
          setData([]);
        } else {
          setData(measurements.filter((m) => m.type === type));
        }

        setNorms(normsData ?? null);
      } catch (error) {
        console.error("Błąd w hooku useHealthChartData:", error);
        setData([]);
        setNorms(null);
      }
    };

    fetchData();
  }, [type, refreshKey]);

  const prepared: PreparedData[] = data
    .map((m) => {
      const date = new Date(m.createdAt);
      let value: number | [number, number];

      if (
        type === "ciśnienie" &&
        typeof m.systolic === "number" &&
        typeof m.diastolic === "number"
      ) {
        value = [m.systolic, m.diastolic];
      } else {
        value = Number(m.amount ?? 0);
      }

      return { date, value };
    })
    .filter((m) => !isNaN(m.date.getTime()))
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 7);

  return { prepared, norms };
}
