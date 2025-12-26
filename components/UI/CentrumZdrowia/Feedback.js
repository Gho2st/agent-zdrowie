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
    <div className="bg-white border border-gray-200 p-6 md:p-8 rounded-3xl flex flex-col h-full min-h-[300px]">
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-200">
        <div className="p-3 bg-violet-50 text-violet-600 rounded-2xl">
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

      <div className="flex-1 flex flex-col justify-center">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
            <p className="text-violet-700 font-medium text-sm">
              Analizuję Twoje wyniki zdrowotne...
            </p>
          </div>
        ) : adviceText ? (
          <div className="flex flex-col h-full">
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 flex-1">
              <Quote className="w-6 h-6 text-gray-300 mb-4" />

              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
                {adviceText}
              </div>

              {generatedAt && (
                <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                  <span>
                    Wygenerowano:{" "}
                    {format(generatedAt, "d MMM, HH:mm", { locale: pl })}
                  </span>
                  <span className="flex items-center gap-1 text-violet-600 font-medium">
                    <Sparkles className="w-3 h-3" /> AI
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleGenerateAdvice}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 border border-gray-300 rounded-xl"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Odśwież analizę
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center h-full">
            <div className="bg-violet-50 p-4 rounded-full mb-4">
              <Sparkles className="w-8 h-8 text-violet-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Osobisty Asystent Zdrowia
            </h3>
            <p className="text-sm text-gray-600 mb-8 max-w-xs mx-auto leading-relaxed">
              Kliknij poniżej, aby Agent przeanalizował Twoje ostatnie pomiary i
              przygotował spersonalizowaną poradę.
            </p>

            <button
              onClick={handleGenerateAdvice}
              className="inline-flex items-center gap-2 px-6 py-3 font-semibold text-white bg-violet-600 rounded-xl"
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
