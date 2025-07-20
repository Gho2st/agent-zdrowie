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

export default function useHealthChartData(type: string) {
  const [data, setData] = useState<Measurement[]>([]);
  const [norms, setNorms] = useState<Norms | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [mRes, nRes] = await Promise.all([
        fetch("/api/measurement"),
        fetch("/api/user/norms"),
      ]);

      const measurements: Measurement[] = await mRes.json();
      const normsData: Norms = await nRes.json();

      setData(measurements.filter((m) => m.type === type));
      setNorms(normsData);
    };

    fetchData();
  }, [type]);

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
    .slice(-7); // tylko ostatnie 7 pomiarów

  return { prepared, norms };
}
