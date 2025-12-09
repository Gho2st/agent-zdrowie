"use client";

import { useState, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { Sparkles, Loader2, RotateCcw, Bot, Quote } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

export default function Feedback() {
  const [generatedAt, setGeneratedAt] = useState(null);

  // Konfiguracja hooka AI
  const { messages, append, isLoading } = useChat({
    api: "/api/chat",
    id: "feedback-agent",
    // Opcjonalnie: onFinish pozwala zapisać czas dopiero po zakończeniu generowania
    onFinish: () => setGeneratedAt(new Date()),
  });

  // Funkcja wywołująca AI
  const handleGenerateAdvice = useCallback(() => {
    // Resetujemy datę, by pokazać, że coś się dzieje
    setGeneratedAt(null);

    append({
      role: "user",
      content:
        "Na podstawie wszystkich moich dostępnych danych zdrowotnych (waga, ciśnienie, cukier, samopoczucie) przygotuj krótkie, spersonalizowane podsumowanie. Wskaż jeden sukces i jedną rzecz do poprawy. Zachowaj ton empatycznego lekarza.",
    });
  }, [append]);

  // Pobieramy ostatnią wiadomość asystenta
  // Używamy .content, co jest standardem w Vercel AI SDK dla tekstu
  const latestAssistantMessage = messages
    .filter((m) => m.role === "assistant")
    .pop();

  const adviceText = latestAssistantMessage?.content || "";

  return (
    <div className="relative overflow-hidden bg-white/40 backdrop-blur-xl border border-white/50 shadow-xl rounded-3xl p-6 md:p-8 transition-all hover:shadow-2xl">
      {/* Dekoracyjne tło */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-400/20 rounded-full blur-2xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-purple-400/20 rounded-full blur-3xl pointer-events-none"></div>

      {/* Nagłówek */}
      <div className="relative flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg text-white">
          <Bot className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Asystent Zdrowia AI
          </h2>
          <p className="text-sm text-gray-500">
            Inteligentna analiza Twoich wyników
          </p>
        </div>
      </div>

      {/* Główna sekcja treści */}
      <div className="relative min-h-[120px] flex flex-col justify-center">
        {isLoading ? (
          // STAN: Ładowanie
          <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in fade-in duration-500">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-400 blur-lg opacity-20 animate-pulse"></div>
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin relative z-10" />
            </div>
            <p className="text-blue-700 font-medium text-sm">
              Analizuję Twoje ostatnie wyniki...
            </p>
          </div>
        ) : adviceText ? (
          // STAN: Wyświetlanie wyniku
          <div className="animate-in slide-in-from-bottom-2 duration-500">
            <div className="relative bg-white/60 border border-white/60 rounded-2xl p-6 shadow-sm">
              <Quote className="absolute top-4 left-4 w-8 h-8 text-blue-100 -z-10 transform -scale-x-100" />

              <div className="prose prose-blue prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
                {adviceText}
              </div>

              {generatedAt && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                  <span>
                    Wygenerowano:{" "}
                    {format(generatedAt, "d MMMM, HH:mm", { locale: pl })}
                  </span>
                  <span className="flex items-center gap-1 text-blue-400">
                    <Sparkles className="w-3 h-3" /> GPT-4o
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleGenerateAdvice}
                className="group flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors shadow-sm"
              >
                <RotateCcw className="w-4 h-4 transition-transform group-hover:-rotate-180 duration-500" />
                Odśwież analizę
              </button>
            </div>
          </div>
        ) : (
          // STAN: Zachęta (Pusty stan)
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Kliknij poniżej, aby Agent przeanalizował Twoje ostatnie pomiary
              ciśnienia, wagi i nastroju, i przygotował spersonalizowaną poradę
              na dziś.
            </p>
            <button
              onClick={handleGenerateAdvice}
              className="group relative inline-flex items-center justify-center gap-2 px-8 py-3 font-semibold text-white transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Sparkles className="w-5 h-5 animate-pulse" />
              Generuj poradę
              <div className="absolute inset-0 rounded-full ring-2 ring-white/20 group-hover:ring-white/40 transition-all"></div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
