"use client";

import { useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { Sparkles } from "lucide-react";

export default function PowitanieMotywacja({ userName }) {
  const hasAsked = useRef(false); // Zapobiega podwójnemu zapytaniu

  // Inicjalizacja chatu z API
  const { messages, append, isLoading } = useChat({
    api: "/api/chat",
    id: "motywacja",
  });

  // Wysłanie zapytania o motywacyjne hasło przy pierwszym renderowaniu
  useEffect(() => {
    if (!hasAsked.current && messages.length === 0) {
      append({
        role: "user",
        content:
          "Wygeneruj krótkie, pozytywne w formie lekkiego żartu, dowcipu, zachęty lub hasła zdanie motywacyjne dla użytkownika aplikacji zdrowotnej. Nie używaj powitania.",
      });
      hasAsked.current = true;
    }
  }, [append, messages.length]);

  const gptResponse = messages
    .find((m) => m.role === "assistant")
    ?.parts.find((part) => part.type === "text")?.text;

  // Renderowanie powitania i motywacyjnego hasła
  return (
    <div className="mb-8">
      <h1 className="text-3xl xl:text-4xl font-bold text-gray-900">
        Hej, {userName}! 👋
      </h1>
      <div className="mt-4 flex items-center gap-2 text-gray-600 text-lg min-h-[2rem]">
        {isLoading ? (
          <span className="animate-pulse">Generuję motywację…</span>
        ) : (
          <span className="flex gap-1">
            <Sparkles className="hidden md:block text-blue-500" />
            {gptResponse}
          </span>
        )}
      </div>
    </div>
  );
}
