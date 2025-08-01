"use client";

import Container from "@/components/UI/Container/Container";
import Header from "@/components/UI/Headers/Header";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { User, Measurement } from "@prisma/client";
import toast from "react-hot-toast";
import { useChat } from "@ai-sdk/react";
import TrendMiniCisnienie from "@/components/UI/CentrumZdrowia/Trendy/TrendMiniCisnienie";
import TrendMiniCukier from "@/components/UI/CentrumZdrowia/Trendy/TrendMiniCukier";
import TrendMiniTetno from "@/components/UI/CentrumZdrowia/Trendy/TrendMiniTetno";
import TrendMiniWaga from "@/components/UI/CentrumZdrowia/Trendy/TrendMiniWaga";
import ListaPomiarow from "./ListaPomiarów";

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
  const [filterType, setFilterType] = useState<string>("all");

  const [glucoseContext, setGlucoseContext] = useState("");
  const [glucoseTime, setGlucoseTime] = useState("przed posiłkiem");
  const [pressureNote, setPressureNote] = useState("");

  const [norms, setNorms] = useState<Partial<User> | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [chatId, setChatId] = useState(() => `feedback-${Date.now()}`);

  useEffect(() => {
    // Resetuj ID przy wejściu na stronę
    setChatId(`feedback-${Date.now()}`);
  }, []);

  const { messages, append, isLoading } = useChat({
    api: "/api/chat",
    id: chatId,
  });

  const fetchAgentAdvice = async () => {
    await append({
      role: "user",
      content:
        "Na podstawie tylko ostatniego pomiaru oceń go",
    });
  };

  const lastAssistantMessage = messages
    .slice()
    .reverse()
    .find((m) => m.role === "assistant");

  const gptResponse = lastAssistantMessage?.parts.find(
    (p) => p.type === "text"
  )?.text;

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
  const requestDelete = (id: string) => {
    setConfirmDeleteId(id); // pokaż modal
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;

    const res = await fetch(`/api/measurement/${confirmDeleteId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setMeasurements((prev) =>
        prev.filter((m) => String(m.id) !== confirmDeleteId)
      );
      toast.success("Pomiar został usunięty");
    } else {
      toast.error("Błąd podczas usuwania pomiaru");
    }

    setConfirmDeleteId(null);
  };

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
      await fetchAgentAdvice();
    } else {
      const data = await res.json();
      toast.error(data.error || "Błąd dodawania pomiaru");
    }
  };

  if (status === "loading") {
    return <div>Wczytywanie...</div>;
  }

  return (
    <Container>
      <Header text="Pomiary" />
      <p className="text-gray-600 mt-4 mb-8">
        Zarządzaj swoimi pomiarami w prosty i przejrzysty sposób
      </p>
      {/* góra lewo prawo na desktopie */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Formularz dodawania */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/30 backdrop-blur-lg border border-white/20 p-6 md:p-8 rounded-2xl shadow-xl w-full mx-auto space-y-5 transition-all duration-300"
        >
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
              className="w-full p-3 rounded-lg border bg-white/30  border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none"
            >
              <option value="ciśnienie">💓 Ciśnienie</option>
              <option value="cukier">🍭 Cukier</option>
              <option value="waga">⚖️ Waga</option>
              <option value="tętno">❤️ Tętno</option>
            </select>
          </div>

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
                  : "np. 72"
              }
              className="w-full p-3 rounded-lg border bg-white/30 border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none"
            />
          </div>

          <input
            type="text"
            value={unit}
            readOnly
            className="w-full p-3 border rounded-lg border-gray-300 bg-green-50 text-gray-600"
          />

          {type === "cukier" && (
            <>
              <input
                type="text"
                value={glucoseContext}
                onChange={(e) => setGlucoseContext(e.target.value)}
                className="w-full p-3 border bg-white/30 border-gray-300 rounded-lg"
                placeholder="Co jadłeś przed pomiarem?"
              />
              <select
                value={glucoseTime}
                onChange={(e) => setGlucoseTime(e.target.value)}
                className="w-full p-3 border bg-white/30 border-gray-300 rounded-lg"
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
              className="w-full p-3 bg-white/30 border border-gray-300 rounded-lg"
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

        <div>
          {type === "ciśnienie" && <TrendMiniCisnienie />}
          {type === "cukier" && <TrendMiniCukier />}
          {type === "tętno" && <TrendMiniTetno />}
          {type === "waga" && <TrendMiniWaga />}
        </div>
      </div>
      {isLoading && (
        <div className="mt-6 text-center text-sm text-gray-500">
          Generowanie porady zdrowotnej...
        </div>
      )}
      {gptResponse && (
        <div className="mt-10 p-5 bg-blue-50 border border-blue-200 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            Feedback od Agenta Zdrowie
          </h3>
          <p className="text-blue-900 whitespace-pre-line">{gptResponse}</p>
        </div>
      )}
      <ListaPomiarow
        measurements={measurements}
        filterType={filterType}
        setFilterType={setFilterType}
        requestDelete={requestDelete}
        confirmDeleteId={confirmDeleteId}
        setConfirmDeleteId={setConfirmDeleteId}
        confirmDelete={confirmDelete}
      />{" "}
    </Container>
  );
}
