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
import DailyCheckin from "@/components/UI/CentrumZdrowia/DailyCheckin";
import TrendCheckinEnergy from "@/components/UI/CentrumZdrowia/Trendy/TrendCheckinEnergy";

export default function CentrumZdrowia() {
  const { data: session } = useSession();
  const fullName = session?.user?.name || "Użytkowniku";
  const userName = fullName.split(" ")[0];

  return (
    <Container>
      <div className="">
        <PowitanieMotywacja userName={userName} />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <StreakTracker />
          <Feedback />
          <DailyCheckin />
          <OstatniePomiary />
          <TrendCheckinEnergy />

          <TrendMiniWaga />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <TrendMiniCukier />
          <TrendMiniCisnienie />
          <TrendMiniTetno />
        </div>

        <div className="grid md:grid-cols-2 md:gap-8">
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
    </Container>
  );
}
