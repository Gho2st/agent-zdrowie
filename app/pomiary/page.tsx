"use client";

import Container from "@/components/UI/Container/Container";
import Header from "@/components/UI/Headers/Header";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { User, Measurement } from "@prisma/client";
import toast from "react-hot-toast";
import { useChat } from "@ai-sdk/react";
import TrendMiniCisnienie from "@/components/UI/CentrumZdrowia/Trendy/TrendMiniCisnienie";
import TrendMiniCukier from "@/components/UI/CentrumZdrowia/Trendy/TrendMiniCukier";
import TrendMiniTetno from "@/components/UI/CentrumZdrowia/Trendy/TrendMiniTetno";
import TrendMiniWaga from "@/components/UI/CentrumZdrowia/Trendy/TrendMiniWaga";
import ListaPomiarow from "./ListaPomiarów";
import { Loader2 } from "lucide-react";

// --- Types ---
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

type GlucoseTiming = "przed posiłkiem" | "po posiłku" | "rano" | "wieczorem";

// --- Helpers ---
const defaults = {
  ciśnienie: "mmHg",
  cukier: "mg/dL",
  waga: "kg",
  tętno: "bpm",
} as const;

function asBP(v: string): { sys: number; dia: number } | null {
  const m = v.replace(/\s+/g, "").match(/^(\d{2,3})\/(\d{2,3})$/);
  return m ? { sys: Number(m[1]), dia: Number(m[2]) } : null;
}

type TextPart = { type: "text"; text: string };
type ContentPart = { type: string } & Record<string, unknown>;

function isTextPart(p: ContentPart): p is TextPart {
  return (
    p.type === "text" && typeof (p as { text?: unknown }).text === "string"
  );
}

function checkNorms(
  t: string,
  v: number,
  n: Partial<User> | null,
  unit: string,
  timing?: GlucoseTiming
): { out: boolean; msg?: string } {
  if (!n) return { out: false };
  if (t === "cukier") {
    if (
      timing === "przed posiłkiem" &&
      n.glucoseFastingMin != null &&
      n.glucoseFastingMax != null
    ) {
      const out = v < n.glucoseFastingMin || v > n.glucoseFastingMax;
      return out
        ? {
            out,
            msg: `Twój cukier ${v} ${unit} poza normą na czczo (${n.glucoseFastingMin}–${n.glucoseFastingMax} ${unit}).`,
          }
        : { out: false };
    }
    if (timing === "po posiłku" && n.glucosePostMealMax != null) {
      const out = v > n.glucosePostMealMax;
      return out
        ? {
            out,
            msg: `Po posiłku wynik ${v} ${unit} > ${n.glucosePostMealMax} ${unit}.`,
          }
        : { out: false };
    }
  }
  if (t === "waga" && n.weightMin != null && n.weightMax != null) {
    const out = v < n.weightMin || v > n.weightMax;
    return out
      ? {
          out,
          msg: `Waga ${v} ${unit} poza ${n.weightMin}–${n.weightMax} ${unit}.`,
        }
      : { out: false };
  }
  if (t === "tętno" && n.pulseMin != null && n.pulseMax != null) {
    const out = v < n.pulseMin || v > n.pulseMax;
    return out
      ? {
          out,
          msg: `Tętno ${v} ${unit} poza ${n.pulseMin}–${n.pulseMax} ${unit}.`,
        }
      : { out: false };
  }
  return { out: false };
}

export default function Pomiary() {
  const { status } = useSession();

  // --- State ---
  const [type, setType] = useState<keyof typeof defaults>("ciśnienie");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState<string>(defaults["ciśnienie"]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [refreshKey, setRefreshKey] = useState(0);

  const [glucoseContext, setGlucoseContext] = useState("");
  const [glucoseTime, setGlucoseTime] =
    useState<GlucoseTiming>("przed posiłkiem");
  const [pressureNote, setPressureNote] = useState("");

  const [norms, setNorms] = useState<Partial<User> | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmittedAt, setLastSubmittedAt] = useState<number | null>(null);

  // Stabilny chatId na sesję komponentu
  const [chatId] = useState(() => `feedback-${crypto.randomUUID()}`);

  const { messages, append, isLoading } = useChat({
    api: "/api/chat",
    id: chatId,
  });

  const fetchAgentAdvice = async () => {
    try {
      await append({
        role: "user",
        content:
          "Na podstawie tylko ostatniego pomiaru oceń go, bierz pod uwagę notki jakie zostawił user",
      });
    } catch (e) {
      // miękka obsługa — brak toast, żeby nie męczyć usera
      console.error("AI advice error", e);
    }
  };

  const gptResponse = useMemo(() => {
    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.role === "assistant");
    const c: unknown = lastAssistant?.content;
    if (!c) return undefined;

    if (typeof c === "string") return c;

    if (Array.isArray(c)) {
      const parts = c as ContentPart[];
      return parts
        .filter(isTextPart)
        .map((p) => p.text)
        .join("\n");
    }

    return undefined;
  }, [messages]);
  // Fetch danych po zalogowaniu
  useEffect(() => {
    if (status !== "authenticated") return;
    (async () => {
      try {
        const [mRes, nRes] = await Promise.all([
          fetch("/api/measurement"),
          fetch("/api/user/norms"),
        ]);
        if (!mRes.ok || !nRes.ok) throw new Error("fetch");
        const m = await mRes.json();
        const n = await nRes.json();
        if (Array.isArray(m)) setMeasurements(m);
        else throw new Error("measurements-not-array");
        setNorms(n);
      } catch (e) {
        console.error(e);
        toast.error("Nie udało się pobrać danych");
      }
    })();
  }, [status]);

  // Helpers UI
  const requestDelete = (id: string) => setConfirmDeleteId(id);

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    const prev = measurements;
    setMeasurements((p) => p.filter((m) => String(m.id) !== confirmDeleteId));
    try {
      const res = await fetch(`/api/measurement/${confirmDeleteId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Pomiar został usunięty");
    } catch (error) {
      console.error(error);
      setMeasurements(prev);
      toast.error("Błąd podczas usuwania pomiaru");
    } finally {
      setConfirmDeleteId(null);
    }
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== "authenticated") {
      toast.error("Zaloguj się, aby dodać pomiar");
      return;
    }
    if (isSubmitting) return; // guard

    const now = Date.now();
    if (lastSubmittedAt && now - lastSubmittedAt < 5000) {
      toast.error("Odczekaj chwilę przed kolejnym pomiarem.");
      return;
    }

    setIsSubmitting(true);
    setLastSubmittedAt(now);

    const body: MeasurementInput = { type, unit } as MeasurementInput;
    let isOutOfNorm = false;
    let alertDetails = "";

    try {
      if (type === "ciśnienie") {
        const bp = asBP(value);
        if (!bp) {
          toast.error("Niepoprawny format ciśnienia (np. 120/80)");
          return;
        }
        body.systolic = bp.sys;
        body.diastolic = bp.dia;
        body.note = pressureNote?.trim() || undefined;

        if (
          norms?.systolicMin != null &&
          norms?.systolicMax != null &&
          norms?.diastolicMin != null &&
          norms?.diastolicMax != null &&
          (bp.sys < norms.systolicMin ||
            bp.sys > norms.systolicMax ||
            bp.dia < norms.diastolicMin ||
            bp.dia > norms.diastolicMax)
        ) {
          isOutOfNorm = true;
          alertDetails = `Zapisano pomiar, ale Twoje ciśnienie ${bp.sys}/${bp.dia} mmHg wykracza poza normę.\nSkurczowe: ${norms.systolicMin}–${norms.systolicMax}, Rozkurczowe: ${norms.diastolicMin}–${norms.diastolicMax}`;
        }
      } else {
        const numeric = Number(String(value).replace(",", "."));
        if (!Number.isFinite(numeric)) {
          toast.error("Niepoprawna wartość");
          return;
        }
        body.amount = numeric;

        if (type === "cukier") {
          body.context = glucoseContext?.trim() || undefined;
          body.timing = glucoseTime;
          const res = checkNorms(type, numeric, norms, unit, glucoseTime);
          if (res.out) {
            isOutOfNorm = true;
            alertDetails = res.msg || "Wynik poza normą.";
          }
        }

        if (type === "waga") {
          const res = checkNorms(type, numeric, norms, unit);
          if (res.out) {
            isOutOfNorm = true;
            alertDetails = res.msg!;
          }
        }

        if (type === "tętno") {
          const res = checkNorms(type, numeric, norms, unit);
          if (res.out) {
            isOutOfNorm = true;
            alertDetails = res.msg!;
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
        toast.error(data.error || "Błąd dodawania pomiaru");
        return;
      }

      // reset form
      setValue("");
      setGlucoseContext("");
      setGlucoseTime("przed posiłkiem");
      setPressureNote("");

      // refresh list
      const refreshRes = await fetch("/api/measurement");
      if (refreshRes.ok) {
        setMeasurements(await refreshRes.json());
        setRefreshKey(Date.now());
      }

      if (isOutOfNorm) toast.error(alertDetails);
      else toast.success("Pomyślnie dodano pomiar w normie!");

      // poproś agenta o krótką ocenę
      fetchAgentAdvice();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Autopodpowiedź wartości dla cukru (drobny UX)
  useEffect(() => {
    if (type !== "cukier") return;
    if (value !== "") return;
    if (glucoseTime === "przed posiłkiem") setValue("85");
    else if (glucoseTime === "po posiłku") setValue("110");
  }, [glucoseTime, type, value]);

  // Rerender jednostki przy zmianie typu
  useEffect(() => {
    setUnit(defaults[type]);
  }, [type]);

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        Wczytywanie...
      </div>
    );
  }

  const glucoseTimings: GlucoseTiming[] = [
    "przed posiłkiem",
    "po posiłku",
    "rano",
    "wieczorem",
  ];

  return (
    <Container>
      <Header text="Pomiary" />
      <p className="text-gray-600 mt-4 mb-8">
        Zarządzaj swoimi pomiarami w prosty i przejrzysty sposób
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Formularz dodawania */}
        <form
          onSubmit={handleSubmit}
          aria-busy={isSubmitting}
          className={
            "relative bg-white/30 backdrop-blur-lg border border-white/20 p-6 md:p-8 rounded-2xl shadow-xl w-full mx-auto space-y-5 transition-all duration-300" +
            (isSubmitting ? " opacity-80" : "")
          }
        >
          {/* Typ */}
          <div>
            <label
              htmlFor="type"
              className="text-sm font-medium text-gray-700 block mb-1"
            >
              Typ pomiaru
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => {
                const t = e.target.value as keyof typeof defaults;
                setType(t);
                setValue("");
              }}
              className="w-full p-3 rounded-lg border bg-white/30 border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none"
            >
              <option value="ciśnienie">💓 Ciśnienie</option>
              <option value="cukier">🍭 Cukier</option>
              <option value="waga">⚖️ Waga</option>
              <option value="tętno">❤️ Tętno</option>
            </select>
          </div>

          {/* Wartość */}
          <div>
            <label
              htmlFor="value"
              className="text-sm font-medium text-gray-700 block mb-1"
            >
              {type === "ciśnienie" ? "Ciśnienie (np. 120/80)" : "Wartość"}
            </label>
            {type === "ciśnienie" ? (
              <input
                id="value"
                type="text"
                inputMode="numeric"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
                placeholder="np. 120/80"
                title="Podaj w formacie 120/80"
                onInvalid={(e) =>
                  (e.currentTarget as HTMLInputElement).setCustomValidity(
                    "Podaj ciśnienie w formacie 120/80"
                  )
                }
                onInput={(e) =>
                  (e.currentTarget as HTMLInputElement).setCustomValidity("")
                }
                className="w-full p-3 rounded-lg border bg-white/30 border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none"
              />
            ) : (
              <input
                id="value"
                type="number"
                inputMode="decimal"
                step="any"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
                placeholder={type === "tętno" ? "np. 70" : "np. 72"}
                className="w-full p-3 rounded-lg border bg-white/30 border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none"
              />
            )}
          </div>

          {/* Jednostka jako badge */}
          <div className="text-sm text-gray-700">
            Jednostka:
            <span className="ml-2 px-2 py-1 rounded-md bg-green-100 text-green-800 border border-green-200 align-middle">
              {unit}
            </span>
          </div>

          {/* Pola kontekstowe */}
          {type === "cukier" && (
            <>
              <label
                htmlFor="glucoseContext"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Kontekst pomiaru{" "}
                <span className="text-gray-400">(opcjonalne)</span>
              </label>
              <textarea
                id="glucoseContext"
                value={glucoseContext}
                onChange={(e) => setGlucoseContext(e.target.value)}
                rows={1}
                placeholder="Co jadłeś przed pomiarem?"
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = el.scrollHeight + "px";
                }}
                className="w-full p-3 border bg-white/30 border-gray-300 rounded-lg resize-none overflow-hidden focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />

              <div>
                <span className="block text-sm font-medium text-gray-700 mb-1">
                  Kiedy mierzono?
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {glucoseTimings.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setGlucoseTime(t)}
                      aria-pressed={glucoseTime === t}
                      className={`p-2 rounded-lg border transition ${
                        glucoseTime === t
                          ? "bg-green-600 text-white border-green-600"
                          : "bg-white/30 border-gray-300 hover:bg-white/50"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {type === "ciśnienie" && (
            <div>
              <label
                htmlFor="pressureNote"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Notatka <span className="text-gray-400">(opcjonalne)</span>
              </label>
              <textarea
                id="pressureNote"
                value={pressureNote}
                onChange={(e) => setPressureNote(e.target.value)}
                rows={1}
                placeholder="np. stres, wysiłek"
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = el.scrollHeight + "px";
                }}
                className="w-full p-3 bg-white/30 border border-gray-300 rounded-lg resize-none overflow-hidden focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={status !== "authenticated" || isSubmitting}
            className="relative bg-green-600 hover:bg-green-700 text-white w-full font-semibold py-3 rounded-lg transition disabled:opacity-50"
          >
            {isSubmitting && (
              <span className="absolute inset-0 flex items-center justify-center">
                <svg
                  className="h-5 w-5 animate-spin"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                </svg>
              </span>
            )}
            <span className={isSubmitting ? "invisible" : ""}>
              Zapisz pomiar
            </span>
          </button>
        </form>

        {/* Trendy */}
        <div className="space-y-6">
          <div className={type !== "ciśnienie" ? "hidden" : ""}>
            <TrendMiniCisnienie refreshKey={refreshKey} />
          </div>
          <div className={type !== "cukier" ? "hidden" : ""}>
            <TrendMiniCukier refreshKey={refreshKey} />
          </div>
          <div className={type !== "tętno" ? "hidden" : ""}>
            <TrendMiniTetno refreshKey={refreshKey} />
          </div>
          <div className={type !== "waga" ? "hidden" : ""}>
            <TrendMiniWaga refreshKey={refreshKey} />
          </div>
        </div>
      </div>

      {gptResponse && (
        <section className="mt-10 p-5 bg-white/30 border border-blue-200 rounded-lg shadow-md">
          <header className="flex items-center justify-between mb-2">
            <h3 className="text-lg xl:text-2xl font-semibold text-blue-800">
              Feedback od Agenta Zdrowie
            </h3>
            <time className="text-xs text-blue-700/70">
              {new Date().toLocaleString("pl-PL")}
            </time>
          </header>
          {isLoading && (
            <div
              className="flex mb-6 items-center justify-center gap-2 text-sm text-blue-700  rounded-lg py-3 px-4"
              aria-live="polite"
            >
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              <span className="font-medium">
                Generowanie porady zdrowotnej...
              </span>
            </div>
          )}
          <p className="text-blue-900 whitespace-pre-line">{gptResponse}</p>
          <div className="mt-3 text-right">
            <button
              type="button"
              className="px-3 py-1.5 text-sm rounded-md border cursor-pointer border-blue-300 text-blue-800 bg-white/60 hover:bg-blue-100"
              onClick={() =>
                append({
                  role: "user",
                  content:
                    "Podpowiedz mi plan na dziś na podstawie tego wyniku.",
                })
              }
            >
              Poproś o plan na dziś
            </button>
          </div>
        </section>
      )}

      <ListaPomiarow
        measurements={measurements}
        filterType={filterType}
        setFilterType={setFilterType}
        requestDelete={requestDelete}
        confirmDeleteId={confirmDeleteId}
        setConfirmDeleteId={setConfirmDeleteId}
        confirmDelete={confirmDelete}
      />
    </Container>
  );
}
