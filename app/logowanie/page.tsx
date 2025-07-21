"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { FcGoogle } from "react-icons/fc";
import { Loader2 } from "lucide-react";

export default function Logowanie() {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkProfile = async () => {
      if (status === "authenticated") {
        try {
          const res = await fetch("/api/user/profile-complete");
          const data = await res.json();

          if (!data.complete && pathname !== "/rejestracja-dodatkowa") {
            router.replace("/rejestracja-dodatkowa");
          } else {
            router.replace("/");
          }
        } catch (err) {
          console.error("❌ Błąd sprawdzania profilu:", err);
        }
      }
    };

    checkProfile();
  }, [status, pathname, router]);

  const handleLogin = async () => {
    await signIn("google");
  };

  // 🔄 Pokaż loader zanim załadujemy sesję
  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-blue-200 to-purple-200">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-blue-200 to-purple-200 px-4">
      <div className="bg-white shadow-xl rounded-3xl p-10 max-w-md w-full text-center animate-fade-in">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          👋 Witamy w Agent Zdrowie
        </h1>
        <p className="text-gray-600 mb-8 text-sm">
          Zaloguj się przez Google, aby rozpocząć zarządzanie swoim zdrowiem
        </p>

        <button
          onClick={handleLogin}
          className="w-full flex cursor-pointer items-center justify-center gap-3 bg-white text-gray-800 font-semibold border border-gray-300 px-6 py-3 rounded-lg shadow-sm hover:shadow-md hover:bg-gray-50 transition-all"
        >
          <FcGoogle size={22} />
          Zaloguj się przez Google
        </button>
      </div>
    </div>
  );
}
