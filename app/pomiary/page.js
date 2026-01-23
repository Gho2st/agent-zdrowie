"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useChat } from "@ai-sdk/react";
import { Loader2, PlusCircle, Sparkles, Bot, Save } from "lucide-react";

import Container from "@/components/UI/Container/Container";
import Header from "@/components/UI/Headers/Header";
import TrendMini from "@/components/UI/CentrumZdrowia/TrendMini";
import ListaPomiarow from "./ListaPomiarów";
import { analyzeMeasurement } from "../utils/healthAnalysis";

// KONFIGURACJA TYPÓW POMIARÓW

const MEASUREMENT_TYPES = {
  BLOOD_PRESSURE: {
    label: "Ciśnienie",
    icon: "💓",
    unit: "mmHg",
    input: "blood-pressure",
    contextOptions: null,
    notePlaceholder: "np. stres, po kawie, wieczorem",
  },
  GLUCOSE: {
    label: "Cukier (Glukoza)",
    icon: "🍭",
    unit: "mg/dL",
    input: "number",
    contextOptions: ["przed posiłkiem", "po posiłku"],
    notePlaceholder: "np. po dużym wysiłku...",
  },
  HEART_RATE: {
    label: "Tętno",
    icon: "❤️",
    unit: "bpm",
    input: "number",
    contextOptions: ["spoczynkowe", "podczas treningu"],
    notePlaceholder: "np. po schodach, zdenerwowany...",
  },
  WEIGHT: {
    label: "Waga",
    icon: "⚖️",
    unit: "kg",
    input: "number",
    contextOptions: null,
    notePlaceholder: "np. na czczo, z ubraniem...",
  },
};

// GŁÓWNY KOMPONENT

export default function Pomiary() {
  const { status } = useSession();

  const [type, setType] = useState("BLOOD_PRESSURE");
  const [value, setValue] = useState("");
  const [context, setContext] = useState("");
  const [note, setNote] = useState("");

  const [measurements, setMeasurements] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const [norms, setNorms] = useState(null);
  const [hasHighRisk, setHasHighRisk] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [chatId] = useState(() => `health-${crypto.randomUUID()}`);
  const { messages, append, isLoading, setMessages } = useChat({
    api: "/api/chat",
    id: chatId,
    onError: () => toast.error("Błąd generowania porady AI"),
  });

  const config = MEASUREMENT_TYPES[type] || MEASUREMENT_TYPES.BLOOD_PRESSURE;

  useEffect(() => {
    if (type === "HEART_RATE") {
      setContext("spoczynkowe");
    }
  }, [type]);

  // Ładowanie pomiarów i norm
  useEffect(() => {
    if (status !== "authenticated") return;

    (async () => {
      try {
        const [mRes, nRes] = await Promise.all([
          fetch("/api/measurement", { cache: "no-store" }),
          fetch("/api/user/norms", { cache: "no-store" }),
        ]);

        if (!mRes.ok || !nRes.ok) throw new Error();

        const [mData, nData] = await Promise.all([mRes.json(), nRes.json()]);

        setMeasurements(Array.isArray(mData) ? mData : []);
        setNorms(nData);
        setHasHighRisk(!!nData?.hasHighRisk);
      } catch {
        toast.error("Nie udało się wczytać danych");
      }
    })();
  }, [status, refreshKey]);

  //  ZAPIS POMIARU

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || status !== "authenticated") return;

    setIsSubmitting(true);

    const data = prepareMeasurementData(
      type,
      value,
      context,
      note,
      norms,
      hasHighRisk,
    );

    if (!data.valid) {
      toast.error(data.error);
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/measurement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.body),
      });

      if (!res.ok) throw new Error(await res.text());

      // reset formularza
      setValue("");
      setContext("");
      setNote("");
      setRefreshKey((k) => k + 1);

      showAnalysisToast(data.analysis);

      // AI porada po 800–1200 ms
      setTimeout(() => fetchAgentAdvice(data.aiPayload, data.analysis), 1000);
    } catch (err) {
      console.error(err);
      toast.error("Błąd zapisu pomiaru");
    } finally {
      setIsSubmitting(false);
    }
  };

  // USUWANIE POMIARU

  const requestDelete = useCallback((id) => setConfirmDeleteId(id), []);

  const confirmDelete = useCallback(async () => {
    if (!confirmDeleteId) return;

    const id = confirmDeleteId;
    setMeasurements((prev) => prev.filter((m) => m.id !== id));

    try {
      const res = await fetch(`/api/measurement/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Pomiar usunięty");
    } catch {
      toast.error("Nie udało się usunąć");
      setRefreshKey((k) => k + 1);
    } finally {
      setConfirmDeleteId(null);
    }
  }, [confirmDeleteId]);

  // PORADA AI

  const fetchAgentAdvice = async (currentData, analysisResult) => {
    try {
      setMessages([]);

      const userAge = norms?.birthdate
        ? calculateAge(norms.birthdate)
        : "nieznany";
      const userGender = norms?.gender === "MALE" ? "mężczyzna" : "kobieta";
      const userHeight = norms?.height || "nieznany";
      const userWeight = norms?.weight || "nieznany";
      const userBMI = norms?.bmi || "nieznany";
      const userActivity = norms?.activityLevel?.toLowerCase() || "nieznany";
      const userConditions = norms?.conditions || "brak";
      const userMedications = norms?.medications || "brak";

      const prompt = `
Użytkownik: ${userGender}, około ${userAge} lat, wzrost ${userHeight} cm, waga ~${userWeight} kg (BMI ${userBMI}), poziom aktywności: ${userActivity}.
Stany zdrowotne / choroby: ${userConditions || "brak podanych"}
Leki i suplementy: ${userMedications || "brak podanych"}

Ostatni pomiar:
- Typ: ${currentData.type}
- Wartość: ${currentData.formattedValue}
- Kontekst: ${currentData.context || "brak"}${currentData.context ? ` (${currentData.context})` : ""}
- Notatka: "${currentData.note || "brak"}"

Wynik analizy systemu:
- Status: ${analysisResult?.status || "UNKNOWN"}
- Komunikat systemowy: "${analysisResult?.message || "—"}"
- Poza normą: ${analysisResult?.isOutOfNorm ? "tak" : "nie"}

Napisz po polsku krótką (3–5 zdań, maksymalnie 100 słów), ciepłą, ale rzeczową poradę.

Ścisłe zasady w zależności od statusu:

Nigdy nie:
- nie zmieniaj dawek leków
- nie stawiaj diagnozy
- nie bagatelizuj wyników poza normą

Używaj naturalnego, wspierającego języka – jakbyś rozmawiał z bliską osobą, której zależy na zdrowiu.

Odpowiedz WYŁĄCZNIE treścią porady – bez żadnego wstępu, bez podpisu, bez cudzysłowów”.
      `.trim();
      console.log(prompt);
      await append({
        role: "user",
        content: prompt,
      });
    } catch (err) {
      console.error("AI advice error", err);
    }
  };

  const gptResponse = messages
    .filter((m) => m.role === "assistant")
    .pop()?.content;

  // ────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen text-emerald-600">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <Container>
      <Header text="Pomiary" />
      <p className="text-gray-500 mt-2 mb-8 ml-1">
        Dodawaj wyniki, śledź trendy i otrzymuj porady AI.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* FORUMULARZ */}
        <form
          onSubmit={handleSubmit}
          className={`bg-white/80 backdrop-blur-xl border border-white/40 p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200/50 flex flex-col gap-5 transition-all ${
            isSubmitting ? "opacity-75 pointer-events-none" : ""
          }`}
        >
          <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-4">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Nowy wynik</h2>
              <p className="text-xs text-gray-500">Uzupełnij dane poniżej</p>
            </div>
          </div>

          {/* Typ pomiaru */}
          <div>
            <label className="text-sm font-bold text-gray-600 block mb-1.5 ml-1">
              Typ pomiaru
            </label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setValue("");
                setContext("");
                setNote("");
              }}
              className="w-full p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-700 font-medium"
            >
              {Object.entries(MEASUREMENT_TYPES).map(
                ([key, { label, icon }]) => (
                  <option key={key} value={key}>
                    {icon} {label}
                  </option>
                ),
              )}
            </select>
          </div>

          {/* Wartość */}
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1.5 ml-1">
              {type === "BLOOD_PRESSURE"
                ? "Ciśnienie (skurczowe / rozkurczowe)"
                : "Wartość"}
            </label>

            {type === "BLOOD_PRESSURE" ? (
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  placeholder="120"
                  value={value.split("/")[0] || ""}
                  onChange={(e) =>
                    setValue(
                      `${e.target.value}/${value.split("/")[1] || ""}`.replace(
                        /\/$/,
                        "",
                      ),
                    )
                  }
                  className="flex-1 p-3.5 rounded-xl border border-gray-200 text-center font-semibold focus:ring-2 focus:ring-emerald-200"
                  required
                />
                <span className="text-2xl text-gray-300">/</span>
                <input
                  type="number"
                  placeholder="80"
                  value={value.split("/")[1] || ""}
                  onChange={(e) =>
                    setValue(`${value.split("/")[0] || ""}/${e.target.value}`)
                  }
                  className="flex-1 p-3.5 rounded-xl border border-gray-200 text-center font-semibold focus:ring-2 focus:ring-emerald-200"
                  required
                />
              </div>
            ) : (
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="np. 75"
                  className="w-full p-3.5 rounded-xl border border-gray-200 font-semibold focus:ring-2 focus:ring-emerald-200"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                  {config.unit}
                </span>
              </div>
            )}
          </div>

          {/* Kontekst */}
          {config.contextOptions && (
            <div>
              <span className="text-sm font-bold text-gray-600 block mb-1.5 ml-1">
                Kiedy zmierzono?
              </span>
              <div className="grid grid-cols-2 gap-2">
                {config.contextOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setContext(opt)}
                    className={`p-2.5 rounded-xl text-sm font-medium border transition-all ${
                      context === opt
                        ? "bg-emerald-100 border-emerald-300 text-emerald-800 shadow-sm"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notatka */}
          <div>
            <label className="text-sm font-bold text-gray-600 block mb-1.5 ml-1">
              Notatka (opcjonalnie)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={config.notePlaceholder}
              rows={2}
              className="w-full p-3 rounded-xl border border-gray-200 bg-white resize-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          <div className="mt-auto">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {isSubmitting ? "Zapisywanie..." : "Zapisz wynik"}
            </button>
          </div>
        </form>

        {/* Prawy panel – Trend + AI */}
        <div className="flex flex-col gap-6">
          <div className="h-[300px] xl:h-[320px] bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl overflow-hidden">
            <TrendMini data={measurements} type={type} title={config.label} />
          </div>

          <section className="flex-1 bg-white/80 backdrop-blur-xl border border-white/40 p-6 rounded-3xl shadow-xl shadow-slate-200/50 flex flex-col min-h-0">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100 shrink-0">
              <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Feedback AI</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Analiza ostatniego pomiaru
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto relative">
              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm z-10">
                  <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
                  <span className="mt-3 text-sm text-violet-600 animate-pulse">
                    Analizuję wynik...
                  </span>
                </div>
              )}

              {gptResponse ? (
                <div className="animate-in fade-in duration-500">
                  <div className="bg-violet-50/70 p-5 rounded-2xl border border-violet-100 text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                    {gptResponse}
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      className="text-xs flex items-center gap-1.5 text-violet-700 hover:text-violet-900 font-medium bg-white px-3 py-1.5 rounded-lg border border-violet-200 shadow-sm hover:shadow"
                      onClick={() =>
                        append({
                          role: "user",
                          content: "Daj jeszcze jedną konkretną wskazówkę.",
                        })
                      }
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Dopytaj AI
                    </button>
                  </div>
                </div>
              ) : (
                !isLoading && (
                  <div className="h-full flex items-center justify-center text-center py-8 text-gray-400 text-sm italic">
                    Dodaj pomiar, aby zobaczyć analizę i poradę AI
                  </div>
                )
              )}
            </div>
          </section>
        </div>
      </div>

      <ListaPomiarow
        measurements={measurements}
        filterType={filterType}
        setFilterType={setFilterType}
        requestDelete={requestDelete}
        confirmDeleteId={confirmDeleteId}
        setConfirmDeleteId={setConfirmDeleteId}
        confirmDelete={confirmDelete}
        norms={norms}
      />
    </Container>
  );
}

// POMOCNICZE FUNKCJE

function calculateAge(birthdate) {
  if (!birthdate) return 0;
  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function parseBloodPressure(input) {
  if (!input || typeof input !== "string") return null;

  const cleaned = input
    .replace(/[^0-9/ ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const slashMatch = cleaned.match(/^(\d{2,3})\s*\/\s*(\d{2,3})$/);
  if (slashMatch) {
    const sys = Number(slashMatch[1]);
    const dia = Number(slashMatch[2]);
    if (sys >= 70 && dia >= 40 && sys > dia) return { sys, dia };
  }

  const spaceMatch = cleaned.match(/^(\d{2,3})\s+(\d{2,3})$/);
  if (spaceMatch) {
    const sys = Number(spaceMatch[1]);
    const dia = Number(spaceMatch[2]);
    if (sys >= 70 && dia >= 40 && sys > dia) return { sys, dia };
  }

  if (/^\d{4}$/.test(cleaned)) {
    const sys = Number(cleaned.slice(0, 3));
    const dia = Number(cleaned.slice(-2));
    if (sys >= 70 && dia >= 40 && sys > dia) return { sys, dia };
  }

  return null;
}
function prepareMeasurementData(
  type,
  rawValue,
  context,
  note,
  norms,
  hasHighRisk,
) {
  const cfg = MEASUREMENT_TYPES[type] || MEASUREMENT_TYPES.BLOOD_PRESSURE;
  const trimmedNote = note.trim() || undefined;

  if (type === "BLOOD_PRESSURE") {
    const bp = parseBloodPressure(rawValue);
    if (!bp) return { valid: false, error: "Format: 120/80 lub 120 80" };

    const formatted = `${bp.sys}/${bp.dia} ${cfg.unit}`;
    const analysis = analyzeMeasurement(type, bp, norms, {}, hasHighRisk);

    return {
      valid: true,
      body: {
        type,
        unit: cfg.unit,
        systolic: bp.sys,
        diastolic: bp.dia,
        note: trimmedNote,
      },
      aiPayload: {
        type: cfg.label,
        formattedValue: formatted,
        context: "",
        note: trimmedNote,
      },
      analysis,
    };
  }

  // typy numeryczne
  const num = Number(rawValue.replace(",", "."));
  if (!Number.isFinite(num) || num <= 0) {
    return { valid: false, error: "Wprowadź poprawną liczbę" };
  }

  const formatted = `${num} ${cfg.unit}`;
  let extraContext = {};
  let aiContext = context;

  if (type === "GLUCOSE" && context) {
    extraContext = { context };
  } else if (type === "HEART_RATE" && context && context !== "spoczynkowe") {
    extraContext = { context };
  }

  const analysis = analyzeMeasurement(
    type,
    num,
    norms,
    extraContext,
    hasHighRisk,
  );

  return {
    valid: true,
    body: {
      type,
      unit: cfg.unit,
      amount: num,
      ...extraContext,
      note: trimmedNote,
    },
    aiPayload: {
      type: cfg.label,
      formattedValue: formatted,
      context: aiContext,
      note: trimmedNote,
    },
    analysis,
  };
}

function showAnalysisToast(analysis) {
  const { status, message } = analysis || {};

  if (["CRITICAL", "ALARM"].includes(status)) {
    toast.error(message || "Pilnie skontaktuj się z lekarzem!", {
      duration: 8000,
    });
  } else if (status === "ELEVATED_HIGH_RISK") {
    toast(message || "Wynik podwyższony – zwróć uwagę", { duration: 7000 });
  } else if (["OPTIMAL", "IN_TARGET"].includes(status)) {
    toast.success(message || "Świetny wynik! 👏", { duration: 5000 });
  } else {
    toast(message || "Pomiar zapisany", { duration: 4000 });
  }
}
