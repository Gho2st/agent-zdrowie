"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Container from "@/components/UI/Container/Container";

export default function CentrumZdrowia() {
  const { data: session } = useSession();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isCancelled, setIsCancelled] = useState(false);

  const { messages, append, reload, stop, isLoading, error, setMessages } =
    useChat({
      api: "/api/raport",
    });

  useEffect(() => {
    if (!isCancelled) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isCancelled]);

  const handleGenerateReport = () => {
    setIsCancelled(false);
    append({
      role: "user",
      content: `Wygeneruj mój spersonalizowany raport zdrowia na podstawie ostatnich pomiarów, branych leków.`,
    });
  };

  const handleCancel = () => {
    stop(); // zatrzymuje generowanie
    setIsCancelled(true);
  };

  const handleClear = () => {
    setMessages([]);
    setIsCancelled(false);
  };

  return (
    <Container>
      {session?.user ? (
        <div className="max-w-2xl mx-auto py-10 px-4">
          <h1 className="text-2xl font-bold mb-4">Hej, {session.user.name}</h1>
          <p className="text-gray-600 mb-4">
            Kliknij przycisk, aby uzyskać raport zdrowotny wygenerowany przez
            Agenta Zdrowie.
          </p>

          <div className="flex gap-2 mb-6">
            <button
              onClick={handleGenerateReport}
              disabled={isLoading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            >
              🧠 Wygeneruj raport
            </button>

            <button
              onClick={handleCancel}
              disabled={!isLoading}
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition"
            >
              ⏸️ Anuluj
            </button>

            <button
              onClick={handleClear}
              disabled={isLoading}
              className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400 transition"
            >
              🗑️ Wyczyść
            </button>
          </div>

          <div className="space-y-4 mb-6">
            {messages
              .filter((msg) => msg.role !== "user")
              .map((msg) => (
                <div
                  key={msg.id}
                  className="p-4 rounded-xl whitespace-pre-wrap bg-sky-50 border border-sky-200 shadow-sm"
                >
                  <div className="text-sm text-gray-500 mb-2">
                    🤖 Agent Zdrowie
                  </div>
                  {msg.content}
                </div>
              ))}

            {isLoading && (
              <div className="text-sm text-gray-500 italic animate-pulse">
                Tworzę raport zdrowia...
              </div>
            )}
            {isCancelled && (
              <div className="text-sm text-yellow-600 font-medium">
                Raport został anulowany.
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {error && (
            <p className="text-red-500 mt-4">❌ Błąd: {error.message}</p>
          )}
        </div>
      ) : (
        <p className="text-gray-500 text-center mt-20 text-lg">
          Nie jesteś zalogowany
        </p>
      )}
    </Container>
  );
}
