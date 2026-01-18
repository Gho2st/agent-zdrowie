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
  const m = v.replace(/\s+/g, "").match(/^(\d{2,3})\/(\d{2,3})$/);
  return m ? { sys: Number(m[1]), dia: Number(m[2]) } : null;
}

function isTextPart(p) {
  return p.type === "text" && typeof p.text === "string";
}

function checkNorms(typeKey, value, norms, unit, timing) {
  if (!norms) return { out: false };

  if (typeKey === "GLUCOSE") {
    if (
      timing === "przed posiłkiem" &&
      norms.glucoseFastingMin != null &&
      norms.glucoseFastingMax != null
    ) {
      const out =
        value < norms.glucoseFastingMin || value > norms.glucoseFastingMax;
      return out
        ? { out, msg: `Twój cukier ${value} ${unit} poza normą na czczo.` }
        : { out: false };
    }
    if (timing === "po posiłku" && norms.glucosePostMealMax != null) {
      const out = value > norms.glucosePostMealMax;
      return out
        ? {
            out,
            msg: `Po posiłku wynik ${value} ${unit} > ${norms.glucosePostMealMax}.`,
          }
        : { out: false };
    }
  }

  if (
    typeKey === "WEIGHT" &&
    norms.weightMin != null &&
    norms.weightMax != null
  ) {
    const out = value < norms.weightMin || value > norms.weightMax;
    return out ? { out, msg: "Waga poza normą." } : { out: false };
  }

  if (
    typeKey === "HEART_RATE" &&
    norms.pulseMin != null &&
    norms.pulseMax != null
  ) {
    const out = value < norms.pulseMin || value > norms.pulseMax;
    return out ? { out, msg: "Tętno poza normą." } : { out: false };
  }

  return { out: false };
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

  const [norms, setNorms] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmittedAt, setLastSubmittedAt] = useState(null);

  const [chatId] = useState(() => `feedback-${crypto.randomUUID()}`);

  const { messages, append, isLoading, setMessages } = useChat({
    api: "/api/chat",
    id: chatId,
    onError: (err) => {
      console.error("Chat error", err);
      toast.error("Błąd generowania porady AI");
    },
  });

  const fetchAgentAdvice = async (currentData) => {
    try {
      setMessages([]);

      const promptContent = `
        Oceń ten konkretny, nowy wynik zdrowotny. Nie analizuj historii, tylko ten jeden pomiar:
        - Typ: ${currentData.type}
        - Wartość: ${currentData.formattedValue}
        - Pora/Kontekst: ${currentData.context || "Brak"}
        - Notatka użytkownika: ${currentData.note || "Brak"}
        
        Czy ten wynik jest w normie? Daj krótką, empatyczną wskazówkę (max 2-3 zdania).
      `;

      await append({
        id: `msg-${Date.now()}`,
        role: "user",
        content: promptContent,
      });
    } catch (e) {
      console.error("AI advice error", e);
    }
  };

  const gptResponse = useMemo(() => {
    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.role === "assistant");
    const c = lastAssistant?.content;
    if (!c) return undefined;
    if (typeof c === "string") return c;
    if (Array.isArray(c)) {
      return c
        .filter(isTextPart)
        .map((p) => p.text)
        .join("\n");
    }
    return undefined;
  }, [messages]);

  useEffect(() => {
    if (status !== "authenticated") return;
    (async () => {
      try {
        const [mRes, nRes] = await Promise.all([
          fetch("/api/measurement", { cache: "no-store" }),
          fetch("/api/user/norms", { cache: "no-store" }),
        ]);
        if (!mRes.ok || !nRes.ok) throw new Error("fetch");
        const m = await mRes.json();
        const n = await nRes.json();
        if (Array.isArray(m)) setMeasurements(m);
        setNorms(n);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [status, refreshKey]);

  useEffect(() => {
    setUnit(defaults[type]);
  }, [type]);

  const currentDisplay = typeDisplay[type] || { label: "Pomiar", icon: "" };

  const requestDelete = useCallback((id) => setConfirmDeleteId(id), []);
  const confirmDelete = useCallback(async () => {
    if (!confirmDeleteId) return;
    setMeasurements((p) => p.filter((m) => String(m.id) !== confirmDeleteId));
    try {
      const res = await fetch(`/api/measurement/${confirmDeleteId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Usunięto");
    } catch {
      setRefreshKey((prev) => prev + 1);
      toast.error("Błąd usuwania");
    } finally {
      setConfirmDeleteId(null);
    }
  }, [confirmDeleteId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status !== "authenticated") {
      toast.error("Zaloguj się");
      return;
    }
    if (isSubmitting) return;

    const now = Date.now();
    if (lastSubmittedAt && now - lastSubmittedAt < 2000) return;

    setIsSubmitting(true);
    setLastSubmittedAt(now);

    const body = { type, unit };
    let isOutOfNorm = false;
    let alertDetails = "";

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
          toast.error("Format: 120/80");
          setIsSubmitting(false);
          return;
        }
        body.systolic = bp.sys;
        body.diastolic = bp.dia;
        body.note = pressureNote?.trim() || undefined;

        aiDataPayload.formattedValue = `${bp.sys}/${bp.dia} ${unit}`;
        aiDataPayload.note = pressureNote;

        if (norms?.systolicMin != null && norms?.systolicMax != null) {
          if (bp.sys < norms.systolicMin || bp.sys > norms.systolicMax) {
            isOutOfNorm = true;
            alertDetails = "Ciśnienie poza normą.";
          }
        }
      } else {
        const numeric = Number(String(value).replace(",", "."));
        if (!Number.isFinite(numeric) || numeric < 0) {
          toast.error("Błędna wartość");
          setIsSubmitting(false);
          return;
        }
        body.amount = numeric;

        aiDataPayload.formattedValue = `${numeric} ${unit}`;

        if (type === "GLUCOSE") {
          body.context = glucoseTime || undefined;
          body.note = glucoseContext?.trim() || undefined;
          aiDataPayload.context = `${glucoseTime}, ${glucoseContext || ""}`;

          const res = checkNorms(type, numeric, norms, unit, glucoseTime);
          if (res.out) {
            isOutOfNorm = true;
            alertDetails = res.msg;
          }
        }

        if (type === "WEIGHT" || type === "HEART_RATE") {
          if (type === "HEART_RATE") {
            body.note = pulseNote?.trim() || undefined;
            aiDataPayload.note = pulseNote;
          }
          const res = checkNorms(type, numeric, norms, unit);
          if (res.out) {
            isOutOfNorm = true;
            alertDetails = res.msg;
          }
        }
      }

      const res = await fetch("/api/measurement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Błąd");
        return;
      }

      // Reset formularza
      setValue("");
      setGlucoseContext("");
      setPressureNote("");
      setPulseNote("");

      setRefreshKey(Date.now());

      if (isOutOfNorm) toast.error(alertDetails);
      else toast.success("Zapisano!");

      setTimeout(() => {
        fetchAgentAdvice(aiDataPayload);
      }, 100);
    } catch (err) {
      console.error(err);
      toast.error("Wystąpił błąd");
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
            h-full relative bg-white/80 backdrop-blur-xl border border-white/40 p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200/50 
            flex flex-col gap-5 transition-all duration-300
            ${isSubmitting ? "opacity-80 pointer-events-none" : ""}
          `}
        >
          <div className="flex items-center gap-3 mb-2 border-b border-gray-100 pb-4">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Nowy wynik</h2>
              <p className="text-xs text-gray-500">Uzupełnij dane poniżej</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-gray-600 block mb-1.5 ml-1">
              Typ pomiaru
            </label>
            <div className="relative">
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
          </div>

          <div>
            <label className="text-sm font-bold text-gray-600 block mb-1.5 ml-1">
              {type === "BLOOD_PRESSURE"
                ? "Wynik (skurczowe/rozkurczowe)"
                : "Wartość wyniku"}
            </label>
            <div className="relative">
              {type === "BLOOD_PRESSURE" ? (
                <input
                  type="text"
                  inputMode="numeric"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                  placeholder="np. 120/80"
                  className="w-full p-3.5 rounded-xl border border-gray-200 bg-white text-gray-800 font-semibold"
                />
              ) : (
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
              )}
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                {unit}
              </span>
            </div>
          </div>

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

          {(type === "BLOOD_PRESSURE" || type === "HEART_RATE") && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <label className="text-sm font-bold text-gray-600 block mb-1.5 ml-1">
                Notatka
              </label>
              <textarea
                value={type === "BLOOD_PRESSURE" ? pressureNote : pulseNote}
                onChange={(e) =>
                  type === "BLOOD_PRESSURE"
                    ? setPressureNote(e.target.value)
                    : setPulseNote(e.target.value)
                }
                rows={1}
                placeholder="np. stres, po kawie"
                className="w-full p-3 rounded-xl border border-gray-200 bg-white"
              />
            </div>
          )}

          <div className="mt-auto">
            <button
              type="submit"
              disabled={status !== "authenticated" || isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transition-all disabled:opacity-50"
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
              {isLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 bg-white/50 backdrop-blur-sm z-10">
                  <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
                  <span className="text-sm font-medium text-violet-600 animate-pulse">
                    Analizuję wynik...
                  </span>
                </div>
              ) : null}

              {gptResponse ? (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 pb-2">
                  <div className="bg-violet-50/50 p-4 rounded-2xl border border-violet-100 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {gptResponse}
                  </div>
                  {!isLoading && (
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        className="text-xs flex items-center gap-1.5 text-violet-600 hover:text-violet-800 font-medium bg-white px-3 py-1.5 rounded-lg border border-violet-100 shadow-sm transition-colors"
                        onClick={() =>
                          append({
                            role: "user",
                            content: "Daj wskazówkę co teraz zrobić.",
                          })
                        }
                      >
                        <Sparkles className="w-3 h-3" />
                        Dopytaj
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                !isLoading && (
                  <div className="h-full flex flex-col items-center justify-center text-center py-4">
                    <p className="text-gray-400 text-sm italic">
                      Dodaj pomiar, aby otrzymać analizę.
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
