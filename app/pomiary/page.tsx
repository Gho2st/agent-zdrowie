"use client";

import Container from "@/components/UI/Container/Container";
import Header from "@/components/UI/Headers/Header";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { User, Measurement } from "@prisma/client";
import toast from "react-hot-toast";

type MeasurementInput = {
  type: string;
  unit: string;
  systolic?: number;
  diastolic?: number;
  note?: string;
  amount?: number;
  context?: string;
  timing?: string;
};

export default function Pomiary() {
  const { status } = useSession();
  const [type, setType] = useState("ciśnienie");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("mmHg");
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [filterType, setFilterType] = useState("all");

  const [glucoseContext, setGlucoseContext] = useState("");
  const [glucoseTime, setGlucoseTime] = useState("przed posiłkiem");
  const [pressureNote, setPressureNote] = useState("");

  const [norms, setNorms] = useState<Partial<User> | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/measurement")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setMeasurements(data);
          } else {
            toast.error("Błąd podczas pobierania pomiarów");
            console.error("Odpowiedź API nie jest tablicą:", data);
          }
        });

      fetch("/api/user/norms")
        .then((res) => res.json())
        .then(setNorms);
    }
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== "authenticated") {
      toast.error("Zaloguj się, aby dodać pomiar");
      return;
    }

    const body: MeasurementInput = { type, unit };
    let isOutOfNorm = false;
    let alertDetails = "";

    if (type === "ciśnienie") {
      const parts = value.split("/").map(Number);
      if (parts.length !== 2 || parts.some(isNaN)) {
        toast.error("Niepoprawny format ciśnienia (np. 120/80)");
        return;
      }
      body.systolic = parts[0];
      body.diastolic = parts[1];
      body.note = pressureNote;

      if (
        norms?.systolicMin != null &&
        norms?.systolicMax != null &&
        norms?.diastolicMin != null &&
        norms?.diastolicMax != null &&
        (body.systolic < norms.systolicMin ||
          body.systolic > norms.systolicMax ||
          body.diastolic < norms.diastolicMin ||
          body.diastolic > norms.diastolicMax)
      ) {
        isOutOfNorm = true;
        alertDetails = `Zapisano pomiar, ale Twoje ciśnienie ${body.systolic}/${body.diastolic} mmHg wykracza poza normę.\nSkurczowe: ${norms.systolicMin}–${norms.systolicMax}, Rozkurczowe: ${norms.diastolicMin}–${norms.diastolicMax}`;
      }
    } else {
      const numeric = parseFloat(value);
      if (isNaN(numeric)) {
        toast.error("Niepoprawna wartość");
        return;
      }
      body.amount = numeric;

      if (type === "cukier") {
        body.context = glucoseContext;
        body.timing = glucoseTime;

        if (glucoseTime === "przed posiłkiem") {
          if (
            norms?.glucoseFastingMin != null &&
            norms?.glucoseFastingMax != null &&
            (numeric < norms.glucoseFastingMin ||
              numeric > norms.glucoseFastingMax)
          ) {
            isOutOfNorm = true;
            alertDetails = `Twój cukier ${numeric} ${unit} wykracza poza normę na czczo.\nNorma: ${norms.glucoseFastingMin}–${norms.glucoseFastingMax} ${unit}`;
          }
        } else if (glucoseTime === "po posiłku") {
          if (
            norms?.glucosePostMealMax != null &&
            numeric > norms.glucosePostMealMax
          ) {
            isOutOfNorm = true;
            alertDetails = `Twój cukier ${numeric} ${unit} wykracza poza normę po posiłku.\nNorma: < ${norms.glucosePostMealMax} ${unit}`;
          }
        }
      }

      if (
        type === "waga" &&
        norms?.weightMin != null &&
        norms?.weightMax != null &&
        (numeric < norms.weightMin || numeric > norms.weightMax)
      ) {
        isOutOfNorm = true;
        alertDetails = `Twoja waga ${numeric} ${unit} wykracza poza normę.\nNorma: ${norms.weightMin}–${norms.weightMax} ${unit}`;
      }

      if (
        type === "tętno" &&
        norms?.pulseMin != null &&
        norms?.pulseMax != null &&
        (numeric < norms.pulseMin || numeric > norms.pulseMax)
      ) {
        isOutOfNorm = true;
        alertDetails = `Twoje tętno ${numeric} ${unit} wykracza poza normę.\nNorma: ${norms.pulseMin}–${norms.pulseMax} ${unit}`;
      }
    }

    const res = await fetch("/api/measurement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setValue("");
      setGlucoseContext("");
      setGlucoseTime("przed posiłkiem");
      setPressureNote("");

      const refreshRes = await fetch("/api/measurement");
      if (refreshRes.ok) {
        setMeasurements(await refreshRes.json());
      }

      if (isOutOfNorm) {
        toast.error(`${alertDetails}`);
      } else {
        toast.success("Pomyślnie dodano pomiar w normie!");
      }
    } else {
      const data = await res.json();
      toast.error(data.error || "Błąd dodawania pomiaru");
    }
  };

  const filteredMeasurements = measurements.filter((m: Measurement) =>
    filterType === "all" ? true : m.type === filterType
  );

  if (status === "loading") {
    return <div>Wczytywanie...</div>;
  }

  return (
    <Container>
      <Header text="Pomiary" />
      <p className="text-gray-600 mt-4 mb-8">
        Zarządzaj swoimi pomiarami w prosty i przejrzysty sposób
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 md:p-8 rounded-2xl shadow-xl w-full mx-auto space-y-5 transition-all duration-300"
      >
        {/* Typ pomiaru */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Typ pomiaru
          </label>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              if (e.target.value === "ciśnienie") setUnit("mmHg");
              else if (e.target.value === "cukier") setUnit("mg/dL");
              else if (e.target.value === "waga") setUnit("kg");
              else if (e.target.value === "tętno") setUnit("bpm");
              setValue("");
            }}
            className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none"
          >
            <option value="ciśnienie">💓 Ciśnienie</option>
            <option value="cukier">🍭 Cukier</option>
            <option value="waga">⚖️ Waga</option>
            <option value="tętno">❤️ Tętno</option>
          </select>
        </div>

        {/* Wartość */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            {type === "ciśnienie" ? "Ciśnienie (np. 120/80)" : "Wartość"}
          </label>
          <input
            type={type === "ciśnienie" ? "text" : "number"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
            placeholder={
              type === "ciśnienie"
                ? "120/80"
                : type === "tętno"
                ? "np. 70"
                : "np. 50"
            }
            className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none"
          />
        </div>

        {/* Jednostka */}
        <input
          type="text"
          value={unit}
          readOnly
          className="w-full p-3 border border-gray-200 rounded-lg bg-gray-100 text-gray-600"
        />

        {/* Pola kontekstowe dla cukru i ciśnienia */}
        {type === "cukier" && (
          <>
            <input
              type="text"
              value={glucoseContext}
              onChange={(e) => setGlucoseContext(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
              placeholder="Co jadłeś przed pomiarem?"
            />
            <select
              value={glucoseTime}
              onChange={(e) => setGlucoseTime(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
            >
              <option value="przed posiłkiem">Przed posiłkiem</option>
              <option value="po posiłku">Po posiłku</option>
              <option value="rano">Rano</option>
              <option value="wieczorem">Wieczorem</option>
            </select>
          </>
        )}

        {type === "ciśnienie" && (
          <input
            type="text"
            value={pressureNote}
            onChange={(e) => setPressureNote(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
            placeholder="Notatka (np. stres, wysiłek)"
          />
        )}

        <button
          type="submit"
          className="bg-green-600 cursor-pointer hover:bg-green-700 text-white w-full font-semibold py-3 rounded-lg transition"
          disabled={status !== "authenticated"}
        >
          Zapisz pomiar
        </button>
      </form>

      {/* Filtr i lista */}
      <div className="mt-10 mx-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Filtruj pomiary
        </h2>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg"
        >
          <option value="all">Wszystkie</option>
          <option value="ciśnienie">Ciśnienie</option>
          <option value="cukier">Cukier</option>
          <option value="waga">Waga</option>
          <option value="tętno">Tętno</option>
        </select>
      </div>

      <div className="mt-6 mx-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Twoje pomiary</h2>
        {filteredMeasurements.length === 0 ? (
          <p className="text-gray-500 text-center">
            Brak pomiarów do wyświetlenia
          </p>
        ) : (
          <ul className="space-y-3">
            {filteredMeasurements.map((m: Measurement) => (
              <li
                key={m.id}
                className="bg-white p-4 rounded-lg shadow-md text-gray-700"
              >
                <strong className="capitalize">{m.type}</strong>:{" "}
                {m.type === "ciśnienie" && m.systolic && m.diastolic
                  ? `${m.systolic}/${m.diastolic} ${m.unit}`
                  : `${m.amount} ${m.unit}`}{" "}
                – {new Date(m.createdAt).toLocaleString("pl-PL")}
                {m.type === "cukier" && (
                  <p className="text-sm text-gray-500">
                    {m.timing ? `(${m.timing})` : ""}{" "}
                    {m.context && `– ${m.context}`}
                  </p>
                )}
                {m.type === "ciśnienie" && m.note && (
                  <p className="text-sm text-gray-500">Notatka: {m.note}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Container>
  );
}
