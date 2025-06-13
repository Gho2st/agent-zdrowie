"use client";
import { useState } from "react";
import Summary from "@/components/UI/Screens/Summary/Summary";
import Measurements from "@/components/UI/Screens/Measurements/Measurements";
import Profile from "@/components/UI/Screens/Profile/Profile";
import Navigation from "@/components/UI/Screens/Navigation/Navigation";
import AgentAI from "@/components/UI/Screens/AgentAI/AgentAI";
import Statistics from "@/components/UI/Screens/Statistics/Statistics";

export default function App() {
  const [activeScreen, setActiveScreen] = useState("Podsumowanie"); // Domyślny ekran

  // Funkcja do zmiany aktywnego ekranu
  const handleScreenChange = (screen: string) => {
    setActiveScreen(screen);
  };

  // Wybór komponentu do wyświetlenia
  const renderScreen = () => {
    switch (activeScreen) {
      case "Podsumowanie":
        return <Summary />;
      case "Pomiary":
        return <Measurements />;
      case "Profil":
        return <Profile />;
      case "Statystyki":
        return <Statistics />;
      case "Agent AI":
        return <AgentAI />;
      default:
        return <Summary />;
    }
  };

  return (
    <div className="flex">
      {/* Nawigacja po lewej */}
      <Navigation
        onScreenChange={handleScreenChange}
        activeScreen={activeScreen}
      />
      {/* Zawartość po prawej */}
      {renderScreen()}
    </div>
  );
}
