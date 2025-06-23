"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef } from "react";

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, status, error } =
    useChat({
      api: "/api/chat", // endpoint do Twojego route.ts
    });

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">💬 Agent Zdrowie</h1>

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

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={handleInputChange}
          disabled={status !== "ready"}
          placeholder="Zadaj pytanie zdrowotne..."
          className="flex-1 border rounded px-4 py-2"
        />
        <button
          type="submit"
          disabled={status !== "ready"}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Wyślij
        </button>
      </form>

      {error && <p className="text-red-500 mt-4">❌ Błąd: {error.message}</p>}
    </div>
  );
}
