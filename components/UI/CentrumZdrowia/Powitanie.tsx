"use client";

import { useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { Sparkles } from "lucide-react";

interface PowitanieMotywacjaProps {
  userName: string;
}

export default function PowitanieMotywacja({
  userName,
}: PowitanieMotywacjaProps) {
  const hasAsked = useRef(false); // 🧠 zapobiega podwójnemu zapytaniu

  const { messages, append, isLoading } = useChat({
    api: "/api/chat",
    id: "motywacja",
  });

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

  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-900">Hej, {userName}! 👋</h1>
      <div className="mt-4 flex items-center gap-2 text-gray-600 text-base min-h-[2rem]">
        <Sparkles className="w-10 h-10 sm:w-4 sm:h-4 text-blue-500" />
        {isLoading ? (
          <span className="animate-pulse">Generuję motywację…</span>
        ) : (
          <span>{gptResponse}</span>
        )}
      </div>
    </div>
  );
}
