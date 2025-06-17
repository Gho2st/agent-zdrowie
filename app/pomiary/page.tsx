"use client";

import Container from "@/components/UI/Container/Container";
import Header from "@/components/UI/Headers/Header";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { User, Measurement } from "@prisma/client";

export default function Pomiary() {
  const { data: session, status } = useSession();
  const [type, setType] = useState("ciśnienie");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("mmHg");
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [filterType, setFilterType] = useState("all");

  const [glucoseContext, setGlucoseContext] = useState("");
  const [glucoseTime, setGlucoseTime] = useState("przed posiłkiem");
  const [pressureNote, setPressureNote] = useState("");

  const [norms, setNorms] = useState<Partial<User> | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== "authenticated") {
      alert("Zaloguj się, aby dodać pomiar");
      return;
    }

    const body: any = { type, unit };
    let isOutOfNorm = false;
    let alertDetails = "";

    if (type === "ciśnienie") {
      const parts = value.split("/").map(Number);
      if (parts.length !== 2 || parts.some(isNaN)) {
        alert("Niepoprawny format ciśnienia (np. 120/80)");
        return;
      }
      body.systolic = parts[0];
      body.diastolic = parts[1];
      body.note = pressureNote;

      if (
        norms?.systolicMin !== undefined &&
        norms?.systolicMax !== undefined &&
        norms?.diastolicMin !== undefined &&
        norms?.diastolicMax !== undefined &&
        (body.systolic < norms.systolicMin ||
          body.systolic > norms.systolicMax ||
          body.diastolic < norms.diastolicMin ||
          body.diastolic > norms.diastolicMax)
      ) {
        isOutOfNorm = true;
        alertDetails = `Twoje ciśnienie ${body.systolic}/${body.diastolic} mmHg wykracza poza normę.\nSkurczowe: ${norms.systolicMin}–${norms.systolicMax}, Rozkurczowe: ${norms.diastolicMin}–${norms.diastolicMax}`;
      }
    } else {
      const numeric = parseFloat(value);
      if (isNaN(numeric)) {
        alert("Niepoprawna wartość");
        return;
      }
      body.amount = numeric;

      if (type === "cukier") {
        body.context = glucoseContext;
        body.timing = glucoseTime;

        if (
          norms?.glucoseMin !== undefined &&
          norms?.glucoseMax !== undefined &&
          (numeric < norms.glucoseMin || numeric > norms.glucoseMax)
        ) {
          isOutOfNorm = true;
          alertDetails = `Twój cukier ${numeric} ${unit} wykracza poza normę.\nNorma: ${norms.glucoseMin}–${norms.glucoseMax} ${unit}`;
        }
      }

      if (
        type === "waga" &&
        norms?.weightMin !== undefined &&
        norms?.weightMax !== undefined &&
        (numeric < norms.weightMin || numeric > norms.weightMax)
      ) {
        isOutOfNorm = true;
        alertDetails = `Twoja waga ${numeric} ${unit} wykracza poza normę.\nNorma: ${norms.weightMin}–${norms.weightMax} ${unit}`;
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
        alert(`❗ ${alertDetails}`);
      } else {
        alert("✅ Pomyślnie dodano pomiar w normie!");
      }
    } else {
      const data = await res.json();
      alert(data.error || "Błąd dodawania pomiaru");
    }
  };

  const filteredMeasurements = measurements.filter((m: any) =>
    filterType === "all" ? true : m.type === filterType
  );

  if (status === "loading") {
    return <div>Wczytywanie...</div>;
  }

  return (
    <Container>
      <Header text="Pomiary" />

      <p className="text-gray-600 mb-8 text-center max-w-md mx-auto">
        Zarządzaj swoimi pomiarami w prosty i przejrzysty sposób
      </p>

      {status === "unauthenticated" && (
        <p className="text-red-500 text-center font-medium mb-6">
          Zaloguj się, aby zarządzać pomiarami
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 bg-white p-8 rounded-2xl shadow-xl w-full max-w-md mx-auto transition-all duration-300"
      >
        {/* Typ pomiaru */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Typ pomiaru
          </label>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              if (e.target.value === "ciśnienie") setUnit("mmHg");
              else if (e.target.value === "cukier") setUnit("mg/dL");
              else if (e.target.value === "waga") setUnit("kg");
              setValue("");
            }}
            className="w-full p-3 border border-gray-300 rounded-lg"
          >
            <option value="ciśnienie">Ciśnienie</option>
            <option value="cukier">Cukier</option>
            <option value="waga">Waga</option>
          </select>
        </div>

        {/* Wartość */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {type === "ciśnienie" ? "Ciśnienie (np. 120/80)" : "Wartość"}
          </label>
          <input
            type={type === "ciśnienie" ? "text" : "number"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
            placeholder={type === "ciśnienie" ? "120/80" : "Wpisz wartość"}
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
        </div>

        {/* Jednostka */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Jednostka
          </label>
          <input
            type="text"
            value={unit}
            readOnly
            className="w-full p-3 border border-gray-200 rounded-lg bg-gray-100 text-gray-600"
          />
        </div>

        {/* Pola dodatkowe */}
        {type === "cukier" && (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Co jadłeś przed pomiarem?
              </label>
              <input
                type="text"
                value={glucoseContext}
                onChange={(e) => setGlucoseContext(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg"
                placeholder="np. owsianka z bananem"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Czas pomiaru
              </label>
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
            </div>
          </>
        )}

        {type === "ciśnienie" && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notatka (np. stres, kawa, wysiłek)
            </label>
            <input
              type="text"
              value={pressureNote}
              onChange={(e) => setPressureNote(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
              placeholder="np. stresujący dzień"
            />
          </div>
        )}

        {/* Przycisk */}
        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
          disabled={status !== "authenticated"}
        >
          Zapisz pomiar
        </button>
      </form>

      {/* Filtr */}
      <div className="mt-10 max-w-md mx-auto">
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
        </select>
      </div>

      {/* Lista pomiarów */}
      <div className="mt-6 max-w-md mx-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Twoje pomiary</h2>
        {filteredMeasurements.length === 0 ? (
          <p className="text-gray-500 text-center">
            Brak pomiarów do wyświetlenia
          </p>
        ) : (
          <ul className="space-y-3">
            {filteredMeasurements.map((m: any) => (
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
