"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { HeartPulse, Loader2, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

export default function Feedback() {
  const hasAsked = useRef(false);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);

  const { messages, append, isLoading } = useChat({
    api: "/api/chat",
    id: "feedback",
  });

  const askForAdvice = useCallback(() => {
    append({
      role: "user",
      content:
        "Na podstawie wszystkich moich dostępnych danych zdrowotnych daj bardzo krótką, empatyczną poradę. Zwróć uwagę na to, co może wymagać poprawy, ale zachowaj pozytywny ton.",
    });
    setGeneratedAt(new Date());
  }, [append]);

  useEffect(() => {
    if (!hasAsked.current && messages.length === 0) {
      askForAdvice();
      hasAsked.current = true;
    }
  }, [messages.length, askForAdvice]);

  const gptResponse = messages
    .find((m) => m.role === "assistant")
    ?.parts.find((p) => p.type === "text")?.text;

  return (
    <div className="bg-white/30 shadow rounded-2xl p-6">
      <div className="flex flex-col justify-center items-center mb-3 text-gray-800">
        <div className="text-center ">
          <h2 className="text-xl md:text-2xl text-center font-semibold flex items-center justify-center gap-2">
            <HeartPulse className="w-6 h-6 text-red-500" />
            Porada zdrowotna od Agenta
          </h2>
        </div>
        <button
          onClick={askForAdvice}
          disabled={isLoading}
          className="mt-6 text-sm flex items-center gap-1 cursor-pointer text-blue-600 hover:underline disabled:opacity-50"
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
        <p className="">Brak porady do wyświetlenia.</p>
      )}
    </div>
  );
}
