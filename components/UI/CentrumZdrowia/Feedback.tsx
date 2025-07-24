"use client";

import { useEffect, useRef, useState } from "react";
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

  const askForAdvice = () => {
    append({
      role: "user",
      content:
        "Na podstawie wszystkich moich dostępnych danych zdrowotnych daj krótką, empatyczną poradę. Zwróć uwagę na to, co może wymagać poprawy, ale zachowaj pozytywny ton.",
    });
    setGeneratedAt(new Date());
  };

  useEffect(() => {
    if (!hasAsked.current && messages.length === 0) {
      askForAdvice();
      hasAsked.current = true;
    }
  }, [messages.length]);

  const gptResponse = messages
    .find((m) => m.role === "assistant")
    ?.parts.find((p) => p.type === "text")?.text;

  return (
    <div className="bg-white shadow rounded-2xl p-6">
      <div className="flex flex-col md:flex-row items-center justify-between mb-3 text-gray-800">
        <div className="flex items-center justify-center gap-2">
          <HeartPulse className="w-5 h-5 text-red-500" />
          <h2 className="text-base font-semibold">
            Porada zdrowotna od Agenta
          </h2>
        </div>
        <button
          onClick={askForAdvice}
          disabled={isLoading}
          className="text-sm flex my-3 xl:my-0 items-center gap-1 text-blue-600 hover:underline disabled:opacity-50"
        >
          <RotateCcw className="w-4 cursor-pointers h-4" /> Odśwież
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center text-gray-500 py-4">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          <span>Generuję poradę zdrowotną…</span>
        </div>
      ) : gptResponse ? (
        <div className="text-gray-700 whitespace-pre-line leading-relaxed text-sm">
          <p>{gptResponse}</p>
          {generatedAt && (
            <p className="mt-3 text-xs text-gray-400">
              🕒 Wygenerowano:{" "}
              {format(generatedAt, "d MMMM yyyy, HH:mm", { locale: pl })}
            </p>
          )}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">Brak porady do wyświetlenia.</p>
      )}
    </div>
  );
}
