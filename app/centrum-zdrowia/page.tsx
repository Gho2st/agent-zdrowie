"use client";

import { useSession } from "next-auth/react";
import Container from "@/components/UI/Container/Container";
import PowitanieMotywacja from "@/components/UI/CentrumZdrowia/Powitanie";
import StreakTracker from "@/components/UI/CentrumZdrowia/StreakTracker";
import OstatniePomiary from "@/components/UI/CentrumZdrowia/OstatniePomiary";
import CeleZdrowotne from "@/components/UI/CentrumZdrowia/CeleZdrowotne";
import Link from "next/link";
import TrendMiniWaga from "@/components/UI/CentrumZdrowia/Trendy/TrendMiniWaga";
import TrendMiniCisnienie from "@/components/UI/CentrumZdrowia/Trendy/TrendMiniCisnienie";
import TrendMiniCukier from "@/components/UI/CentrumZdrowia/Trendy/TrendMiniCukier";

export default function CentrumZdrowia() {
  const { data: session } = useSession();
  const userName = session?.user?.name || "Użytkowniku";

  return (
    <Container>
      {session?.user ? (
        <div className="">
          <PowitanieMotywacja userName={userName} />
          <StreakTracker />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <TrendMiniWaga />
            <TrendMiniCukier />
            <TrendMiniCisnienie />
          </div>
          <div className="flex justify-center mt-6">
            <Link href="/pomiary">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition">
                ➕ Dodaj pomiar
              </button>
            </Link>
          </div>
          <OstatniePomiary />
          <CeleZdrowotne />
          <div className="text-center mt-6">
            <Link href="/statystyki">
              <span className="text-blue-600 underline text-sm hover:text-blue-800">
                Zobacz pełne statystyki zdrowotne →
              </span>
            </Link>
          </div>
        </div>
      ) : (
        <p className="text-gray-500 text-center mt-20 text-lg">
          Nie jesteś zalogowany
        </p>
      )}
    </Container>
  );
}
