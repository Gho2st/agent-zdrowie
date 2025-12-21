"use client";

import { useState, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { Sparkles, Loader2, RotateCcw, Bot, Quote } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

export default function Feedback() {
  const [generatedAt, setGeneratedAt] = useState(null);

  const { messages, append, isLoading } = useChat({
    api: "/api/chat",
    id: "feedback-agent",
    onFinish: () => setGeneratedAt(new Date()),
  });

  const handleGenerateAdvice = useCallback(() => {
    setGeneratedAt(null);
    append({
      role: "user",
      content:
        "Na podstawie wszystkich moich dostępnych danych zdrowotnych (waga, ciśnienie, cukier, samopoczucie) przygotuj krótkie, spersonalizowane podsumowanie. Wskaż jeden sukces i jedną rzecz do poprawy. Zachowaj ton empatycznego lekarza. Pisz zwięźle.",
    });
  }, [append]);

  const latestAssistantMessage = messages
    .filter((m) => m.role === "assistant")
    .pop();

  const adviceText = latestAssistantMessage?.content || "";

  return (
    <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl border border-white/40 p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200/50 transition-all flex flex-col h-full min-h-[300px]">
      <div className="absolute top-0 right-0 w-32 h-32 bg-violet-400/10 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-fuchsia-400/10 rounded-full blur-3xl pointer-events-none -ml-10 -mb-10"></div>

      <div className="relative flex items-center gap-4 mb-6 pb-4 border-b border-gray-100/50 z-10">
        <div className="p-3 bg-violet-50 text-violet-600 rounded-2xl shadow-sm ring-1 ring-violet-100">
          <Bot className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Inteligentna Analiza
          </p>
          <h2 className="text-xl font-bold text-gray-800 leading-none">
            Asystent AI
          </h2>
        </div>
      </div>

      <div className="relative flex-1 flex flex-col justify-center z-10">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-500 py-8">
            <div className="relative">
              <div className="absolute inset-0 bg-violet-400 blur-xl opacity-20 animate-pulse rounded-full"></div>
              <Loader2 className="w-10 h-10 text-violet-600 animate-spin relative z-10" />
            </div>
            <p className="text-violet-700 font-medium text-sm animate-pulse">
              Analizuję Twoje wyniki zdrowotne...
            </p>
          </div>
        ) : adviceText ? (
          <div className="animate-in slide-in-from-bottom-2 duration-500 flex flex-col h-full">
            <div className="relative bg-white/50 border border-white/60 rounded-2xl p-6 shadow-sm flex-1">
              <Quote className="absolute top-4 left-4 w-6 h-6 text-violet-200 -z-10 transform -scale-x-100" />

              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
                {adviceText}
              </div>

              {generatedAt && (
                <div className="mt-4 pt-4 border-t border-gray-100/50 flex items-center justify-between text-xs text-gray-400">
                  <span>
                    Wygenerowano:{" "}
                    {format(generatedAt, "d MMM, HH:mm", { locale: pl })}
                  </span>
                  <span className="flex items-center gap-1 text-violet-400 font-medium">
                    <Sparkles className="w-3 h-3" /> AI
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleGenerateAdvice}
                className="group flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-500 bg-white/50 border border-gray-200 rounded-xl hover:bg-white hover:text-violet-600 hover:border-violet-200 transition-all shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5 transition-transform group-hover:-rotate-180 duration-500" />
                Odśwież analizę
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center h-full">
            <div className="bg-violet-50 p-4 rounded-full mb-4">
              <Sparkles className="w-8 h-8 text-violet-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Osobisty Asystent Zdrowia
            </h3>
            <p className="text-sm text-gray-500 mb-8 max-w-xs mx-auto leading-relaxed">
              Kliknij poniżej, aby Agent przeanalizował Twoje ostatnie pomiary i
              przygotował spersonalizowaną poradę.
            </p>

            <button
              onClick={handleGenerateAdvice}
              className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold text-white transition-all duration-200 bg-violet-600 rounded-xl hover:bg-violet-700 shadow-lg shadow-violet-200 hover:shadow-violet-300 hover:-translate-y-0.5"
            >
              <Sparkles className="w-4 h-4" />
              Generuj poradę
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
