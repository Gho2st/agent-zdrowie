"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Logowanie() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.user && session.profileComplete === false) {
      router.replace("/rejestracja-dodatkowa");
    }
  }, [session, router]);

  const handleLogin = async () => {
    await signIn("google");
  };

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-blue-200 to-purple-200 px-4">
      <div className="bg-white/30 shadow-xl rounded-3xl p-10 max-w-md w-full text-center animate-fade-in">
        <span className="text-4xl">👋</span>
        <h1 className="text-3xl font-bold text-gray-800 mt-2 mb-4">
          Witamy w Agent Zdrowie
        </h1>
        <p className="text-gray-600 mb-8 text-sm">
          {session
            ? `Zalogowany jako ${session.user?.name}`
            : "Zaloguj się przez Google, aby rozpocząć zarządzanie swoim zdrowiem"}
        </p>

        {session ? (
          <button
            onClick={handleLogout}
            className="w-full flex cursor-pointer items-center justify-center gap-3 bg-red-500 text-white font-semibold border border-red-600 px-6 py-3 rounded-lg shadow-lg hover:shadow-md hover:bg-red-600 transition-all"
          >
            Wyloguj się
          </button>
        ) : (
          <button
            onClick={handleLogin}
            className="w-full flex cursor-pointer items-center justify-center gap-3 bg-white text-gray-800 font-semibold border border-gray-300 px-6 py-3 rounded-lg shadow-lg hover:shadow-md hover:bg-gray-50 transition-all"
          >
            <FcGoogle size={22} />
            Zaloguj się przez Google
          </button>
        )}
      </div>
    </div>
  );
}
