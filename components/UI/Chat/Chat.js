"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Bot, User, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, status } = useChat({
    api: "/api/chat",
    id: "health-assistant-chat",
  });

  const [localError, setLocalError] = useState(null);
  const messagesEndRef = useRef(null);
  const { data: session } = useSession();

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    }
  };

  useEffect(() => {
    if (messages.length > 0 || status === "streaming") {
      scrollToBottom();
    }
  }, [messages, status]);

  const submitIfValid = async () => {
    setLocalError(null);
    if (!input.trim()) return;
    await handleSubmit();
  };

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    await submitIfValid();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitIfValid();
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto  h-[calc(100vh-80px)] md:h-[85vh]">
      <div className="flex flex-col h-full bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="bg-white border-b border-gray-100 p-4 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-100 to-teal-50 rounded-xl text-emerald-600 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800 leading-tight">
                Agent Zdrowie
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs text-gray-500 font-medium">
                  Online
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50 custom-scrollbar scroll-smooth">
          {messages.length === 0 && status === "ready" && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
              <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                <Bot className="w-12 h-12 text-gray-300" />
              </div>
              <p className="text-lg font-semibold text-gray-600">
                W czym mogę Ci dzisiaj pomóc?
              </p>
              <p className="text-sm text-gray-400 mt-1 max-w-xs">
                Opisz swoje objawy lub zapytaj o wyniki badań.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 group ${
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                  msg.role === "user"
                    ? "bg-emerald-600 text-white"
                    : "bg-white border border-gray-200 text-emerald-600"
                }`}
              >
                {msg.role === "user" ? (
                  <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 shadow-sm border border-gray-200">
                    {session.user?.image ? (
                      <img
                        src={session.user?.image}
                        alt="Avatar użytkownika"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-emerald-600 flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                ) : (
                  <Bot className="w-5 h-5" />
                )}
              </div>

              <div
                className={`px-4 py-3 rounded-2xl max-w-[85%] text-sm leading-relaxed shadow-sm transition-all ${
                  msg.role === "user"
                    ? "bg-emerald-600 text-white rounded-tr-none"
                    : "bg-white border border-gray-100 text-gray-800 rounded-tl-none"
                }`}
              >
                {msg.parts.map((part, i) => (
                  <div key={i} className="whitespace-pre-wrap">
                    {part.type === "text" && part.text}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {status === "streaming" && (
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-emerald-600 shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-white border border-gray-100 px-4 py-3.5 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5">
                <div
                  className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-1" />
        </div>

        <div className="bg-white p-4 border-t border-gray-100 shrink-0">
          {localError && (
            <div className="mb-2 px-3 py-1.5 bg-orange-50 text-orange-600 text-xs font-medium rounded-lg w-fit mx-auto border border-orange-100">
              {localError}
            </div>
          )}

          <form
            onSubmit={handleCustomSubmit}
            className="relative flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all shadow-inner"
          >
            <textarea
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={status !== "ready"}
              placeholder="Wpisz wiadomość..."
              className="w-full bg-transparent border-none focus:ring-0 resize-none py-2.5 px-3 text-sm max-h-32 min-h-[44px] text-gray-700 placeholder:text-gray-400 custom-scrollbar"
              rows={1}
            />

            <button
              type="submit"
              disabled={status !== "ready" || !input.trim()}
              className={`p-2.5 rounded-xl mb-0.5 transition-all duration-200 flex items-center justify-center ${
                input.trim()
                  ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md hover:scale-105 active:scale-95"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {status === "streaming" ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5 ml-0.5" />
              )}
            </button>
          </form>

          <p className="text-[10px] text-center text-gray-400 mt-3 font-medium">
            AI nie zastępuje porady lekarskiej. W nagłych wypadkach dzwoń pod
            112.
          </p>
        </div>
      </div>
    </div>
  );
}
