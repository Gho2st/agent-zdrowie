"use client";

import Header from "@/components/UI/Headers/Header";
import Container from "@/components/UI/Container/Container";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function Statistics() {
  const { data: session, status } = useSession();
  const [measurements, setMeasurements] = useState([]);
  const [filterType, setFilterType] = useState("ciśnienie");

  useEffect(() => {
    if (session?.user?.id) {
      const fetchMeasurements = async () => {
        try {
          const res = await fetch("/api/measurement");
          if (res.ok) {
            const data = await res.json();
            console.log("Pobrane pomiary:", data);
            setMeasurements(data);
          } else {
            console.error("Błąd pobierania pomiarów: ", res.status);
          }
        } catch (error) {
          console.error("Błąd sieci: ", error);
        }
      };
      fetchMeasurements();
    }
  }, [session]);

  const filteredMeasurements = measurements
    .filter((m: any) => m.type === filterType)
    .map((m: any) => {
      return {
        date: new Date(m.createdAt).toISOString().split("T")[0], // YYYY-MM-DD
        systolic:
          m.type === "ciśnienie" && m.systolic != null
            ? Number(m.systolic)
            : null,
        diastolic:
          m.type === "ciśnienie" && m.diastolic != null
            ? Number(m.diastolic)
            : null,
        amount:
          m.type !== "ciśnienie" && m.amount != null ? Number(m.amount) : null,
      };
    })
    .filter((m: any) => {
      return filterType === "ciśnienie"
        ? m.systolic != null || m.diastolic != null
        : m.amount != null;
    });

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-green-600"></div>
      </div>
    );
  }

  return (
    <Container>
      <Header text="Statystyki" />
      <p className="text-gray-600 mb-8 text-center max-w-md mx-auto">
        Przeglądaj trendy swoich pomiarów na przejrzystych wykresach
      </p>

      {status === "unauthenticated" && (
        <p className="text-red-500 text-center font-medium mb-6">
          Zaloguj się, aby zobaczyć statystyki
        </p>
      )}

      <div className="max-w-md mx-auto mb-8">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Wybierz typ pomiaru
        </label>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
        >
          <option value="ciśnienie">Ciśnienie</option>
          <option value="cukier">Cukier</option>
          <option value="waga">Waga</option>
        </select>
      </div>

      <div className="max-w-4xl mx-auto bg-white p-6 rounded-2xl shadow-xl">
        {filteredMeasurements.length === 0 ? (
          <p className="text-gray-500 text-center">
            Brak danych dla wybranego typu pomiaru
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={filteredMeasurements}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis
                dataKey="date"
                stroke="#333"
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString("pl-PL", {
                    day: "2-digit",
                    month: "2-digit",
                  })
                }
              />
              <YAxis
                stroke="#333"
                label={{
                  value:
                    filterType === "ciśnienie"
                      ? "mmHg"
                      : filterType === "cukier"
                      ? "mg/dL"
                      : "kg",
                  angle: -90,
                  position: "insideLeft",
                  offset: 10,
                }}
              />
              <Tooltip
                formatter={(value, name) =>
                  `${value} ${
                    filterType === "ciśnienie"
                      ? "mmHg"
                      : filterType === "cukier"
                      ? "mg/dL"
                      : "kg"
                  }`
                }
              />
              <Legend wrapperStyle={{ paddingTop: 10 }} />
              {filterType === "ciśnienie" ? (
                <>
                  <Line
                    type="monotone"
                    dataKey="systolic"
                    name="Ciśnienie skurczowe"
                    stroke="#4bc0c0"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="diastolic"
                    name="Ciśnienie rozkurczowe"
                    stroke="#ff6384"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </>
              ) : (
                <Line
                  type="monotone"
                  dataKey="amount"
                  name={filterType === "cukier" ? "Cukier" : "Waga"}
                  stroke="#4bc0c0"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </Container>
  );
}
