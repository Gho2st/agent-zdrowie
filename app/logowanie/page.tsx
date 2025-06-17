"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function Logowanie() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogin = async () => {
    await signIn("google");
  };

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
  }, [status]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Zaloguj się</h1>
      <button
        onClick={handleLogin}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
      >
        Zaloguj się przez Google
      </button>
    </div>
  );
}
