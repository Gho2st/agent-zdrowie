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
import TrendMiniTetno from "@/components/UI/CentrumZdrowia/Trendy/TrendMiniTetno";
import Feedback from "@/components/UI/CentrumZdrowia/Feedback";

export default function CentrumZdrowia() {
  const { data: session } = useSession();
  const fullName = session?.user?.name || "Użytkowniku";
  const userName = fullName.split(" ")[0];

  return (
    <Container>
      {session?.user ? (
        <div className="">
          <PowitanieMotywacja userName={userName} />
          <div className="grid xl:grid-cols-2 gap-4">
            <StreakTracker />
            <Feedback />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <TrendMiniWaga />
            <TrendMiniCukier />
            <TrendMiniCisnienie />
            <TrendMiniTetno />
          </div>

          <div className="grid md:grid-cols-2 md:gap-8">
            <OstatniePomiary />
            <CeleZdrowotne />
          </div>
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
