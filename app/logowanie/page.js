"use client";

import { signIn, useSession } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { Loader2 } from "lucide-react";
import Link from "next/link";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Logowanie() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session?.profileComplete === false) {
      router.replace("/rejestracja-dodatkowa");
    } else if (
      status === "authenticated" &&
      session?.profileComplete === true
    ) {
      router.replace("/centrum-zdrowia");
    }
  }, [status, session, router]);

  const handleLogin = () => {
    signIn("google", { callbackUrl: "/centrum-zdrowia" });
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-emerald-600">
          <Loader2 className="w-10 h-10 animate-spin" />
          <span className="text-lg font-medium">Wczytywanie...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50 to-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-emerald-600 p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-white opacity-5"></div>
          <h1 className="text-3xl font-bold text-white relative z-10">
            Agent Zdrowie
          </h1>
          <p className="text-emerald-100 text-sm mt-2 relative z-10">
            Twój osobisty asystent zdrowotny
          </p>
        </div>

        <div className="p-8 space-y-8">
          <div className="text-center">
            <div className="text-6xl mb-4">👋</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Zacznij dbać o zdrowie z AI{" "}
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Zaloguj się za pomocą konta Google, aby kontynuować dbanie o swoje
              zdrowie z pomocą AI.
            </p>
          </div>

          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-semibold border-2 border-gray-300 px-6 py-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 group"
          >
            <FcGoogle className="w-6 h-6" />
            <span>Zaloguj się przez Google</span>
          </button>

          <p className="text-center text-xs text-gray-500">
            Kontynuując, akceptujesz naszą{" "}
            <Link
              href="/polityka-prywatnosci"
              className="underline hover:text-emerald-600 transition-colors"
            >
              Politykę prywatności
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
