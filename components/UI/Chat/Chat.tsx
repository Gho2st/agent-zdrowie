"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, status, error } =
    useChat({
      api: "/api/chat",
    });

  const [localError, setLocalError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  const submitIfValid = async () => {
    setLocalError(null);

    if (!input.trim()) {
      setLocalError("⚠️ Wpisz wiadomość przed wysłaniem.");
      return;
    }

    await handleSubmit();
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitIfValid();
  };

  return (
    <div className="max-w-2xl mx-auto px-4">
      <h1 className="text-3xl font-bold mb-4">💬 Agent Zdrowie</h1>

      <p className="text-gray-700 font-medium md:text-lg mb-8">
        Twój osobisty asystent zdrowotny oparty na AI. Zadaj pytanie, a Agent
        Zdrowie odpowie na podstawie Twoich danych medycznych.
      </p>

      <div className="space-y-4 mb-6">
        {messages.length === 0 && status === "ready" && (
          <p className="text-sm text-gray-500 font-medium italic">
            Zadaj pierwsze pytanie, aby rozpocząć rozmowę.
          </p>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-4 rounded-xl max-w-xl w-fit ${
              msg.role === "user"
                ? "bg-green-100 ml-auto text-right"
                : "bg-gray-100 text-left"
            }`}
          >
            <div className="text-xs font-semibold text-gray-500 mb-1">
              {msg.role === "user" ? "Ty" : "Agent Zdrowie 🤖"}
            </div>
            {msg.parts.map((part, i) => (
              <p
                key={i}
                className="leading-relaxed text-sm whitespace-pre-wrap"
              >
                {part.type === "text" && part.text}
              </p>
            ))}
          </div>
        ))}

        {status === "streaming" && (
          <div className="bg-gray-100 p-4 rounded-xl w-fit max-w-xl animate-pulse text-sm text-gray-500">
            Agent Zdrowie pisze...
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleCustomSubmit} className="flex gap-2">
        <textarea
          value={input}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submitIfValid();
            }
          }}
          disabled={status !== "ready"}
          placeholder="Zadaj pytanie zdrowotne..."
          rows={1}
          className="flex-1 border rounded px-4 py-2 bg-white resize-none min-h-[42px] text-sm"
        />

        <button
          type="submit"
          disabled={status !== "ready"}
          className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 transition"
        >
          {status === "streaming" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Wyślij"
          )}
        </button>
      </form>

      {localError && <p className="text-orange-500 mt-4">{localError}</p>}
      {error && <p className="text-red-500 mt-2">❌ Błąd: {error.message}</p>}
    </div>
  );
}
