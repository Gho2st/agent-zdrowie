// hooks/useHealthChartData.ts
import { useEffect, useState } from "react";

export default function useHealthChartData(type: string) {
  const [data, setData] = useState<any>([]);
  const [norms, setNorms] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [mRes, nRes] = await Promise.all([
        fetch("/api/measurement"),
        fetch("/api/user/norms"),
      ]);
      const measurements = await mRes.json();
      const norms = await nRes.json();
      setData(measurements.filter((m: any) => m.type === type));
      setNorms(norms);
    };
    fetchData();
  }, [type]);

  const prepared = data
    .map((m: any) => ({
      date: new Date(m.createdAt),
      value:
        type === "ciśnienie" ? [m.systolic, m.diastolic] : Number(m.amount),
    }))
    .slice(-7); // tylko ostatnie 7

  return { prepared, norms };
}
