"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, status, error } =
    useChat({
      api: "/api/chat",
    });

  const [localError, setLocalError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null); // Resetujemy lokalny błąd

    if (!input.trim()) {
      setLocalError("⚠️ Wpisz wiadomość przed wysłaniem.");
      return;
    }

    await handleSubmit(e); // wywołujemy oryginalny submit
  };

  return (
    <div className="">
      <h1 className="text-3xl font-bold mb-6">💬 Agent Zdrowie</h1>
      <p className="text-gray-700 font-medium text-lg mb-6 max-w-2xl">
        Agent Zdrowie to Twój osobisty asystent zdrowotny, który łączy sztuczną
        inteligencję z Twoimi danymi medycznymi. Na podstawie informacji z bazy
        danych – takich jak pomiary, leki czy historia chorób – AI generuje
        spersonalizowane i empatyczne odpowiedzi. To więcej niż zwykły czat:
        system wie, kim jesteś, co Ci dolega i jak najlepiej Ci pomóc.
      </p>
      <div className="space-y-4 mb-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 rounded-lg max-w-lg ${
              msg.role === "user" ? "bg-green-100 ml-auto" : "bg-gray-100"
            }`}
          >
            {msg.parts.map((part, i) => (
              <p key={i}>{part.type === "text" && part.text}</p>
            ))}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleCustomSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={handleInputChange}
          disabled={status !== "ready"}
          placeholder="Zadaj pytanie zdrowotne..."
          className="flex-1 border rounded px-4 bg-white py-2"
        />
        <button
          type="submit"
          disabled={status !== "ready"}
          className="bg-green-600 cursor-pointer text-white px-4 py-2 rounded"
        >
          Wyślij
        </button>
      </form>

      {localError && <p className="text-orange-500 mt-4">{localError}</p>}
      {error && <p className="text-red-500 mt-2">❌ Błąd: {error.message}</p>}
    </div>
  );
}
