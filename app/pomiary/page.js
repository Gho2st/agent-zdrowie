"use client";

import Container from "@/components/UI/Container/Container";
import Header from "@/components/UI/Headers/Header";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useChat } from "@ai-sdk/react";
import ListaPomiarow from "./ListaPomiarów";
import { Loader2, PlusCircle, Sparkles, Bot, Save } from "lucide-react";
import TrendMini from "@/components/UI/CentrumZdrowia/TrendMini";
import { analyzeMeasurement } from "../utils/healthAnalysis";

const defaults = {
  BLOOD_PRESSURE: "mmHg",
  GLUCOSE: "mg/dL",
  WEIGHT: "kg",
  HEART_RATE: "bpm",
};

const typeDisplay = {
  BLOOD_PRESSURE: { label: "Ciśnienie", icon: "💓" },
  GLUCOSE: { label: "Cukier (Glukoza)", icon: "🍭" },
  WEIGHT: { label: "Waga", icon: "⚖️" },
  HEART_RATE: { label: "Tętno", icon: "❤️" },
};

function asBP(v) {
  const cleaned = v
    .replace(/\s+/g, "")
    .replace(/[:;,\-–—._|]/g, "/")
    .replace(/\\+/g, "/");

  const m = cleaned.match(/^(\d{2,3})\/(\d{2,3})$/);

  if (m) {
    return { sys: Number(m[1]), dia: Number(m[2]) };
  }

  const spaceMatch = v.replace(/\s+/g, " ").match(/^(\d{2,3})\s+(\d{2,3})$/);
  if (spaceMatch) {
    return { sys: Number(spaceMatch[1]), dia: Number(spaceMatch[2]) };
  }

  return null;
}

function isTextPart(p) {
  return p.type === "text" && typeof p.text === "string";
}

export default function Pomiary() {
  const { status } = useSession();

  const [type, setType] = useState("BLOOD_PRESSURE");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState(defaults["BLOOD_PRESSURE"]);

  const [measurements, setMeasurements] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);

  const [glucoseContext, setGlucoseContext] = useState("");
  const [glucoseTime, setGlucoseTime] = useState("przed posiłkiem");
  const [pressureNote, setPressureNote] = useState("");
  const [pulseNote, setPulseNote] = useState("");
  const [pulseContext, setPulseContext] = useState("spoczynkowe");

  const [norms, setNorms] = useState(null);
  const [hasHighRisk, setHasHighRisk] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmittedAt, setLastSubmittedAt] = useState(null);

  const [chatId] = useState(() => `feedback-${crypto.randomUUID()}`);

  const { messages, append, isLoading, setMessages } = useChat({
    api: "/api/chat",
    id: chatId,
    onError: (err) => {
      console.error("Chat error:", err);
      toast.error("Błąd generowania porady AI");
    },
  });

  // --- PORADA AI ---
  const fetchAgentAdvice = async (currentData, analysisResult) => {
    try {
      setMessages([]);

      const isHighRisk = analysisResult.status?.includes("HIGH_RISK") || false;

      const calculateAge = (birthdate) => {
        if (!birthdate) return "nieznany";
        const birthDate = new Date(birthdate);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
          age--;
        }
        return age;
      };

      const userAge = norms?.birthdate
        ? calculateAge(norms.birthdate)
        : "nieznany";
      const userGender = norms?.gender === "MALE" ? "mężczyzna" : "kobieta";
      const userHeight = norms?.height || "nieznany";
      const userWeight = norms?.weight || "nieznany";
      const userBMI = norms?.bmi || "nieznany";
      const userActivity = norms?.activityLevel
        ? norms.activityLevel.toLowerCase()
        : "nieznany";
      const userConditions = norms?.conditions || "brak";
      const userMedications = norms?.medications || "brak";
      const userRisk = norms?.hasHighRisk
        ? "wysokie ryzyko sercowo-naczyniowe"
        : "niskie/średnie";

      const promptContent = `
Użytkownik: ${userGender}, ${userAge} lata, wzrost ${userHeight} cm, waga ~${userWeight} kg, BMI ${userBMI}, aktywność fizyczna: ${userActivity}.
Choroby/stany: ${userConditions}. Leki/suplementy: ${userMedications}.
Grupa ryzyka: ${userRisk}.

Dane pomiaru:
- Typ: ${currentData.type}
- Wartość: ${currentData.formattedValue}
- Kontekst: ${currentData.context || "Brak"}
- Notatka użytkownika: ${currentData.note || "Brak"}

Analiza systemowa:
- Status: ${analysisResult?.status || "UNKNOWN"}
- Komunikat: "${analysisResult?.message || ""}"
- Poza normą: ${analysisResult?.isOutOfNorm ? "TAK" : "NIE"}
${isHighRisk ? "- Pacjent należy do grupy wysokiego ryzyka sercowo-naczyniowego" : ""}

Zadanie:
Daj krótką (2-4 zdania) poradę w języku polskim, uwzględniając kontekst użytkownika (wiek, płeć, aktywność, leki, stany zdrowotne).
- Jeśli OPTIMAL → pochwal użytkownika, zasugeruj utrzymanie stylu życia
- Jeśli ELEVATED → delikatna sugestia zmiany stylu życia, dostosowana do aktywności/leków
- Jeśli ELEVATED_HIGH_RISK → wyraźniejsza sugestia konsultacji / korekty, uwzględnij ryzyko
- Jeśli ALARM / CRITICAL → pilny kontakt z lekarzem, podkreśl wiek/ryzyko
Porada powinna być empatyczna, konkretna i motywująca.
      `;

      await append({
        id: `msg-${Date.now()}`,
        role: "user",
        content: promptContent.trim(),
      });
    } catch (e) {
      console.error("AI advice error:", e);
    }
  };

  const gptResponse = useMemo(() => {
    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.role === "assistant");
    if (!lastAssistant?.content) return null;

    if (typeof lastAssistant.content === "string") return lastAssistant.content;

    if (Array.isArray(lastAssistant.content)) {
      return lastAssistant.content
        .filter(isTextPart)
        .map((p) => p.text)
        .join("\n");
    }
    return null;
  }, [messages]);

  // --- ŁADOWANIE DANYCH ---
  useEffect(() => {
    if (status !== "authenticated") return;

    (async () => {
      try {
        const [mRes, nRes] = await Promise.all([
          fetch("/api/measurement", { cache: "no-store" }),
          fetch("/api/user/norms", { cache: "no-store" }),
        ]);

        if (!mRes.ok || !nRes.ok) throw new Error("Błąd pobierania danych");

        const [measurementsData, normsData] = await Promise.all([
          mRes.json(),
          nRes.json(),
        ]);

        setMeasurements(
          Array.isArray(measurementsData) ? measurementsData : [],
        );
        setNorms(normsData);
        setHasHighRisk(!!normsData?.hasHighRisk);
      } catch (err) {
        console.error("Błąd ładowania:", err);
        toast.error("Nie udało się wczytać pomiarów");
      }
    })();
  }, [status, refreshKey]);

  useEffect(() => {
    setUnit(defaults[type] || "—");
  }, [type]);

  const currentDisplay = typeDisplay[type] || { label: "Pomiar", icon: "" };

  // --- USUWANIE POMIARU ---
  const requestDelete = useCallback((id) => setConfirmDeleteId(id), []);

  const confirmDelete = useCallback(async () => {
    if (!confirmDeleteId) return;

    const idToDelete = confirmDeleteId;
    setMeasurements((prev) => prev.filter((m) => String(m.id) !== idToDelete));

    try {
      const res = await fetch(`/api/measurement/${idToDelete}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Pomiar usunięty");
    } catch {
      toast.error("Nie udało się usunąć pomiaru");
      setRefreshKey((k) => k + 1);
    } finally {
      setConfirmDeleteId(null);
    }
  }, [confirmDeleteId]);

  // --- SUBMIT ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status !== "authenticated") {
      toast.error("Musisz być zalogowany");
      return;
    }
    if (isSubmitting) return;

    const now = Date.now();
    if (lastSubmittedAt && now - lastSubmittedAt < 1800) return;

    setIsSubmitting(true);
    setLastSubmittedAt(now);

    const body = { type, unit };
    let analysisResult = { status: "UNKNOWN", message: "", isOutOfNorm: false };
    let aiDataPayload = {
      type: currentDisplay.label,
      formattedValue: "",
      context: "",
      note: "",
    };

    try {
      if (type === "BLOOD_PRESSURE") {
        const bp = asBP(value);
        if (!bp) {
          toast.error("Uzupełnij oba pola ciśnienia (np. 120 i 80)");
          return;
        }
        body.systolic = bp.sys;
        body.diastolic = bp.dia;
        body.note = pressureNote?.trim() || undefined;

        aiDataPayload.formattedValue = `${bp.sys}/${bp.dia} ${unit}`;
        aiDataPayload.note = pressureNote;

        analysisResult = analyzeMeasurement(type, bp, norms, {}, hasHighRisk);
      } else {
        const numeric = Number(String(value).replace(",", "."));
        if (!Number.isFinite(numeric) || numeric < 0) {
          toast.error("Wprowadź poprawną wartość liczbową");
          return;
        }
        body.amount = numeric;
        aiDataPayload.formattedValue = `${numeric} ${unit}`;

        if (type === "GLUCOSE") {
          body.context = glucoseTime || undefined;
          body.note = glucoseContext?.trim() || undefined;
          aiDataPayload.context = glucoseTime;
          if (glucoseContext?.trim())
            aiDataPayload.context += `, ${glucoseContext.trim()}`;

          analysisResult = analyzeMeasurement(
            type,
            numeric,
            norms,
            { timing: glucoseTime },
            hasHighRisk,
          );
        } else if (type === "HEART_RATE") {
          body.note = pulseNote?.trim() || undefined;
          body.context =
            pulseContext !== "spoczynkowe" ? pulseContext : undefined;

          aiDataPayload.note = pulseNote;
          aiDataPayload.context = pulseContext;

          analysisResult = analyzeMeasurement(
            type,
            numeric,
            norms,
            { context: pulseContext },
            hasHighRisk,
          );
        } else {
          analysisResult = analyzeMeasurement(
            type,
            numeric,
            norms,
            {},
            hasHighRisk,
          );
        }
      }

      // Zapis
      const res = await fetch("/api/measurement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Nie udało się zapisać pomiaru");
        return;
      }

      // Reset
      setValue("");
      setGlucoseContext("");
      setPressureNote("");
      setPulseNote("");
      setRefreshKey((k) => k + 1);

      // TOASTY
      const { status: stat, message } = analysisResult;

      if (stat === "CRITICAL" || stat === "ALARM") {
        toast.error(message, {
          duration: 9000,
          icon: "🚨",
          style: {
            border: "2px solid #dc2626",
            background: "#fef2f2",
            color: "#991b1b",
          },
        });
      } else if (stat === "ELEVATED_HIGH_RISK") {
        toast(message, {
          duration: 7500,
          icon: "⚠️🔴",
          style: {
            borderRadius: "12px",
            background: "#fffbeb",
            color: "#92400e",
            border: "2px solid #f59e0b",
            boxShadow: "0 4px 12px rgba(245,158,11,0.2)",
          },
        });
      } else if (stat === "ELEVATED") {
        toast(message, {
          duration: 6000,
          icon: "⚠️",
          style: {
            borderRadius: "10px",
            background: "#fff7ed",
            color: "#c2410c",
            border: "1px solid #fdba74",
          },
        });
      } else if (stat === "HIGH") {
        toast(message || "Wartość wyraźnie powyżej normy", {
          duration: 7000,
          icon: "🚨",
          style: {
            borderRadius: "12px",
            background: "#fef2f2",
            color: "#991b1b",
            border: "2px solid #dc2626",
            boxShadow: "0 4px 12px rgba(220,38,38,0.15)",
          },
        });
      } else if (stat === "LOW") {
        toast(message, {
          duration: 6000,
          icon: "🔵",
          style: {
            background: "#eff6ff",
            color: "#1e40af",
            border: "1px solid #93c5fd",
          },
        });
      } else if (stat === "IN_TARGET") {
        toast.success(message, { duration: 5000, icon: "🏃‍♂️💚" });
      } else if (stat === "BELOW_TARGET") {
        toast(message, {
          duration: 6000,
          icon: "⚡",
          style: {
            background: "#fffbeb",
            color: "#92400e",
            border: "1px solid #f59e0b",
          },
        });
      } else if (stat === "ABOVE_TARGET") {
        toast(message, {
          duration: 7000,
          icon: "🔥",
          style: {
            background: "#fef2f2",
            color: "#991b1b",
            border: "1px solid #f87171",
          },
        });
      } else {
        toast.success(
          hasHighRisk ? "Wynik w docelowym zakresie ✓" : "Świetny wynik! 👏",
          { duration: 4500 },
        );
      }

      setTimeout(() => {
        toast.success("Pomiar zapisany", {
          duration: 3000,
          style: { background: "#ecfdf5", border: "1px solid #6ee7b7" },
        });
      }, 800);

      setTimeout(() => {
        fetchAgentAdvice(aiDataPayload, analysisResult);
      }, 1200);
    } catch (err) {
      console.error(err);
      toast.error("Wystąpił nieoczekiwany błąd");
    } finally {
      setIsSubmitting(false);
    }
  };

  const TrendSection = useMemo(
    () => (
      <TrendMini data={measurements} type={type} title={currentDisplay.label} />
    ),
    [measurements, type, currentDisplay.label],
  );

  const ListSection = useMemo(
    () => (
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
    ),
    [
      measurements,
      filterType,
      confirmDeleteId,
      norms,
      requestDelete,
      confirmDelete,
    ],
  );

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
        <form
          onSubmit={handleSubmit}
          className={`
            h-full relative bg-white/80 backdrop-blur-xl border border-white/40 
            p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200/50 
            flex flex-col gap-5 transition-all duration-300
            ${isSubmitting ? "opacity-75 pointer-events-none" : ""}
          `}
        >
          {/* Header formularza */}
          <div className="flex items-center gap-3 mb-2 border-b border-gray-100 pb-4">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Nowy wynik</h2>
              <p className="text-xs text-gray-500">Uzupełnij dane poniżej</p>
            </div>
          </div>

          {/* Wybór typu */}
          <div>
            <label className="text-sm font-bold text-gray-600 block mb-1.5 ml-1">
              Typ pomiaru
            </label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setValue("");
              }}
              className="w-full p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-700 font-medium"
            >
              <option value="BLOOD_PRESSURE">💓 Ciśnienie</option>
              <option value="GLUCOSE">🍭 Cukier (Glukoza)</option>
              <option value="WEIGHT">⚖️ Waga</option>
              <option value="HEART_RATE">❤️ Tętno</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1.5 ml-1">
              {type === "BLOOD_PRESSURE"
                ? "Wynik (skurczowe / rozkurczowe) mm/Hg"
                : "Wartość wyniku"}
            </label>
            <div className="relative">
              {type === "BLOOD_PRESSURE" ? (
                <div className="flex items-center gap-3">
                  {/* Pole Skurczowe */}
                  <div className="relative flex-1">
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="120"
                      className="w-full p-3.5 rounded-xl border border-gray-200 bg-white text-gray-800 font-semibold text-center focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none transition-all"
                      // Bierzemy część przed slashem
                      value={value.includes("/") ? value.split("/")[0] : value}
                      onChange={(e) => {
                        const newSys = e.target.value;
                        const currentDia = value.includes("/")
                          ? value.split("/")[1]
                          : "";
                        setValue(`${newSys}/${currentDia}`);
                      }}
                      required
                    />
                  </div>

                  <span className="text-2xl text-gray-300 font-light relative -top-1">
                    /
                  </span>

                  {/* Pole Rozkurczowe */}
                  <div className="relative flex-1">
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="80"
                      className="w-full p-3.5 rounded-xl border border-gray-200 bg-white text-gray-800 font-semibold text-center focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none transition-all"
                      value={
                        value.includes("/") ? value.split("/")[1] || "" : ""
                      }
                      onChange={(e) => {
                        const currentSys = value.includes("/")
                          ? value.split("/")[0]
                          : value;
                        const newDia = e.target.value;
                        setValue(`${currentSys}/${newDia}`);
                      }}
                      required
                    />
                    

                   
                  </div>
                </div>
              ) : (
                <>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    required
                    placeholder="np. 70.5"
                    className="w-full p-3.5 rounded-xl border border-gray-200 bg-white text-gray-800 font-semibold"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                    {unit}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Dodatkowe pola zależne od typu */}
          {type === "GLUCOSE" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <div>
                <span className="text-sm font-bold text-gray-600 block mb-1.5 ml-1">
                  Pora pomiaru
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {["przed posiłkiem", "po posiłku"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setGlucoseTime(t)}
                      className={`p-2.5 rounded-xl text-sm font-medium border transition-all ${
                        glucoseTime === t
                          ? "bg-amber-100 border-amber-300 text-amber-800"
                          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-gray-600 block mb-1.5 ml-1">
                  Dodatkowa notatka (opcjonalnie)
                </label>
                <textarea
                  value={glucoseContext}
                  onChange={(e) => setGlucoseContext(e.target.value)}
                  rows={1}
                  className="w-full p-3 rounded-xl border border-gray-200 bg-white"
                />
              </div>
            </div>
          )}

          {type === "HEART_RATE" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <div>
                <span className="text-sm font-bold text-gray-600 block mb-1.5 ml-1">
                  Kiedy zmierzono tętno?
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {["spoczynkowe", "podczas treningu"].map((ctx) => (
                    <button
                      key={ctx}
                      type="button"
                      onClick={() => setPulseContext(ctx)}
                      className={`
              py-3 px-4 rounded-xl text-sm font-medium border transition-all
              flex items-center justify-center gap-2
              ${
                pulseContext === ctx
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
              }
            `}
                    >
                      {ctx === "spoczynkowe"
                        ? "🪑 Spoczynkowe"
                        : "🏃 Podczas treningu"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-gray-600 block mb-1.5 ml-1">
                  Notatka / dodatkowe informacje (opcjonalnie)
                </label>
                <textarea
                  value={pulseNote}
                  onChange={(e) => setPulseNote(e.target.value)}
                  rows={2}
                  placeholder="np. stres..."
                  className="w-full p-3 rounded-xl border border-gray-200 bg-white resize-none"
                />
              </div>
            </div>
          )}

          {type === "BLOOD_PRESSURE" && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <label className="text-sm font-bold text-gray-600 block mb-1.5 ml-1">
                Notatka
              </label>
              <textarea
                value={pressureNote}
                onChange={(e) => setPressureNote(e.target.value)}
                rows={1}
                placeholder="np. stres, po kawie, wieczorem"
                className="w-full p-3 rounded-xl border border-gray-200 bg-white"
              />
            </div>
          )}

          {/* Przycisk Zapisz */}
          <div className="mt-auto">
            <button
              type="submit"
              disabled={status !== "authenticated" || isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" /> Zapisz wynik
                </>
              )}
            </button>
          </div>
        </form>

        {/* Prawy panel – Trend + AI */}
        <div className="flex flex-col gap-6 h-full">
          <div className="shrink-0 h-[300px] xl:h-[320px]">{TrendSection}</div>

          <section className="flex-1 bg-white/80 backdrop-blur-xl border border-white/40 p-6 rounded-3xl shadow-xl shadow-slate-200/50 flex flex-col min-h-0">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100 shrink-0">
              <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 leading-none">
                  Feedback AI
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Analiza ostatniego pomiaru
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 bg-white/60 backdrop-blur-sm z-10">
                  <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
                  <span className="text-sm font-medium text-violet-600 animate-pulse">
                    Analizuję wynik...
                  </span>
                </div>
              )}

              {gptResponse ? (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 pb-4">
                  <div className="bg-violet-50/60 p-4 rounded-2xl border border-violet-100 text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                    {gptResponse}
                  </div>

                  {!isLoading && (
                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        className="text-xs flex items-center gap-1.5 text-violet-700 hover:text-violet-900 font-medium bg-white px-3 py-1.5 rounded-lg border border-violet-200 shadow-sm hover:shadow transition-all"
                        onClick={() =>
                          append({
                            role: "user",
                            content: "Daj wskazówkę co teraz zrobić.",
                          })
                        }
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Dopytaj AI
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                !isLoading && (
                  <div className="h-full flex flex-col items-center justify-center text-center py-8">
                    <p className="text-gray-400 text-sm italic">
                      Dodaj pomiar, aby otrzymać analizę i poradę AI
                    </p>
                  </div>
                )
              )}
            </div>
          </section>
        </div>
      </div>

      {ListSection}
    </Container>
  );
}
