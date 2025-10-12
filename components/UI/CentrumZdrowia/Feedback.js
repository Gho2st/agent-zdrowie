"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { HeartPulse, Loader2, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

const FRESH_FOR_MS = 1000 * 60 * 60 * 12; // 12 godzin

export default function Feedback() {
  const hasAsked = useRef(false);
  const [generatedAt, setGeneratedAt] = useState(null);

  // Inicjalizacja chatu z API
  const { messages, append, isLoading } = useChat({
    api: "/api/chat",
    id: "feedback",
  });

  // Funkcja do wysyłania zapytania o poradę zdrowotną
  const askForAdvice = useCallback(() => {
    append({
      role: "user",
      content:
        "Na podstawie wszystkich moich dostępnych danych zdrowotnych daj bardzo krótką, empatyczną poradę. Zwróć uwagę na to, co może wymagać poprawy, ale zachowaj pozytywny ton.",
    });
    setGeneratedAt(new Date());
  }, [append]);

  // Sprawdzenie i wywołanie zapytania o poradę, jeśli dane nie są świeże
  useEffect(() => {
    const isFresh =
      generatedAt && Date.now() - generatedAt.getTime() < FRESH_FOR_MS;

    if (!hasAsked.current && messages.length === 0 && !isFresh) {
      askForAdvice();
      hasAsked.current = true;
    }
  }, [messages.length, askForAdvice, generatedAt]);

  const gptResponse = messages
    .find((m) => m.role === "assistant")
    ?.parts.find((p) => p.type === "text")?.text;

  // Renderowanie komponentu z poradą zdrowotną
  return (
    <div className="bg-white/30 shadow rounded-2xl p-6">
      <div className="flex flex-col justify-center items-center mb-3 text-gray-800">
        <h2 className="text-xl md:text-2xl font-semibold flex items-center gap-2">
          <HeartPulse className="w-6 h-6 text-red-500" />
          Porada zdrowotna od Agenta
        </h2>
        <button
          onClick={askForAdvice}
          disabled={isLoading}
          className="mt-6 text-sm flex items-center gap-1 text-blue-600 hover:underline disabled:opacity-50"
        >
          <RotateCcw className="w-4 h-4" />
          Odśwież
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center text-gray-500 py-4">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          <span>Generuję poradę zdrowotną…</span>
        </div>
      ) : gptResponse ? (
        <div className="text-gray-800 whitespace-pre-line leading-relaxed xl:text-lg">
          <p>{gptResponse}</p>
          {generatedAt && (
            <p className="mt-3 text-sm text-gray-500">
              🕒 Wygenerowano:{" "}
              {format(generatedAt, "d MMMM yyyy, HH:mm", { locale: pl })}
            </p>
          )}
        </div>
      ) : (
        <p>Brak porady do wyświetlenia.</p>
      )}
    </div>
  );
}
