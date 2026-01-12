"use client";

import { useSession } from "next-auth/react";
import Container from "@/components/UI/Container/Container";
import PowitanieMotywacja from "@/components/UI/CentrumZdrowia/Powitanie";
import StreakTracker from "@/components/UI/CentrumZdrowia/StreakTracker";
import OstatniePomiary from "@/components/UI/CentrumZdrowia/OstatniePomiary";
import CeleZdrowotne from "@/components/UI/CentrumZdrowia/CeleZdrowotne";
import Feedback from "@/components/UI/CentrumZdrowia/Feedback";
import DailyCheckin from "@/components/UI/CentrumZdrowia/DailyCheckin";
import { useState, useEffect } from "react";

import useCheckinTrends from "@/app/hooks/useCheckinTrends";

import TrendMini from "@/components/UI/CentrumZdrowia/TrendMini";

export default function CentrumZdrowia() {
  const { data: session } = useSession();
  const fullName = session?.user?.name || "Użytkowniku";
  const userName = fullName.split(" ")[0];
  const [refreshKey, setRefreshKey] = useState(0);

  //  Pobieranie Pomiarów
  const [measurements, setMeasurements] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/measurement");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setMeasurements(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [refreshKey]);

  // Pobieranie Trendów Check-in
  const { trends: checkinTrends } = useCheckinTrends(refreshKey);

  return (
    <Container>
      <div className="">
        <PowitanieMotywacja userName={userName} />
        <StreakTracker />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-8">
          <Feedback />
          <DailyCheckin
            onCheckinSuccess={() => setRefreshKey((prev) => prev + 1)}
          />
          <OstatniePomiary />

          <TrendMini
            data={checkinTrends}
            type="CHECKIN"
            title="🔋 Energia vs 🌙 Sen i 😖 Stres"
          />

          <TrendMini
            data={measurements}
            type="WEIGHT"
            title="⚖️ Waga"
            color="#4bc0c0"
          />

          <TrendMini
            data={measurements}
            type="GLUCOSE"
            title="🍭 Glukoza"
            color="#f59e0b"
          />

          <TrendMini
            data={measurements}
            type="BLOOD_PRESSURE"
            title="💓 Ciśnienie"
          />

          <TrendMini
            data={measurements}
            type="HEART_RATE"
            title="❤️ Tętno"
            color="#ec4899"
          />
        </div>
        <div className="mt-8">
          <CeleZdrowotne />
        </div>
      </div>
    </Container>
  );
}
