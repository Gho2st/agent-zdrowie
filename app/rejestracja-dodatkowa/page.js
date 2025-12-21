"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import {
  HeartPulse,
  Droplet,
  Gauge,
  Stethoscope,
  Check,
  ChevronRight,
  Loader2,
  Activity,
} from "lucide-react";

// Komponent pomocniczy kafelka
const ConditionCard = ({ label, subtext, icon: Icon, value, onChange }) => {
  return (
    <div
      onClick={() => onChange(!value)}
      className={`relative flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 group ${
        value
          ? "border-emerald-500 bg-emerald-50 shadow-sm"
          : "border-gray-100 bg-white hover:border-emerald-200 hover:shadow-md"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={`p-2 rounded-lg transition-colors ${
            value
              ? "bg-white text-emerald-600"
              : "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100"
          }`}
        >
          <Icon className="w-6 h-6" strokeWidth={1.5} />
        </div>

        <div
          className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
            value
              ? "bg-emerald-500 border-emerald-500"
              : "border-gray-200 bg-white"
          }`}
        >
          {value && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
        </div>
      </div>

      <span
        className={`font-semibold mb-1 ${
          value ? "text-emerald-900" : "text-gray-700"
        }`}
      >
        {label}
      </span>
      <span className="text-xs text-gray-500 leading-tight">{subtext}</span>
    </div>
  );
};

export default function RejestracjaDodatkowa() {
  // Podstawowe dane
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState("MALE");
  const [height, setHeight] = useState(170);
  const [inputWeight, setInputWeight] = useState("70");
  const [activityLevel, setActivityLevel] = useState("MODERATE");

  // Bezpośrednie stany dla chorób
  const [hasPrediabetes, setHasPrediabetes] = useState(false);
  const [hasDiabetes, setHasDiabetes] = useState(false);
  const [hasHypertension, setHasHypertension] = useState(false);
  const [hasHeartDisease, setHasHeartDisease] = useState(false);
  const [hasKidneyDisease, setHasKidneyDisease] = useState(false);

  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const { status, update } = useSession();

  useEffect(() => {
    const verify = async () => {
      if (status === "unauthenticated") {
        router.replace("/logowanie");
        return;
      }
      if (status === "authenticated") {
        try {
          const res = await fetch(`/api/user/profile-complete/`);
          if (res.ok) {
            const data = await res.json();
            if (data.complete) {
              router.push("/profil");
              return;
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
      setChecking(false);
    };
    verify();
  }, [status, router]);

  const handleWeightChange = (value) => {
    setInputWeight(value);
  };

  const handleSubmit = async () => {
    if (!birthdate) {
      toast.error("Podaj datę urodzenia");
      return;
    }

    const weightNum = parseFloat(inputWeight);
    if (isNaN(weightNum) || weightNum < 20 || weightNum > 300) {
      toast.error("Podaj poprawną wagę");
      return;
    }

    const loadingToast = toast.loading("Tworzenie profilu medycznego...");

    try {
      const payload = {
        birthdate,
        gender,
        height,
        weight: weightNum,
        activityLevel,
        hasDiabetes,
        hasPrediabetes,
        hasHypertension,
        hasHeartDisease,
        hasKidneyDisease,
      };

      const res = await fetch("/api/user/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Błąd zapisu");
      }

      await update();
      toast.success("Profil gotowy!");
      router.push("/profil");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  if (status === "loading" || checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-2 text-emerald-600 font-semibold">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span>Wczytywanie...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex justify-center items-start">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-emerald-600 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-x-10 -translate-y-10"></div>
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-white opacity-5 rounded-full translate-x-10 translate-y-10"></div>
          <h1 className="text-2xl font-bold text-white mb-2 relative z-10">
            Twoja Karta Zdrowia
          </h1>
          <p className="text-emerald-100 text-sm opacity-90 relative z-10 max-w-md mx-auto">
            Uzupełnij dane, aby AI mogła bezpiecznie personalizować Twoje normy.
          </p>
        </div>

        <div className="p-8 space-y-8">
          <section>
            <h2 className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Parametry Ciała
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Data urodzenia
                </label>
                <input
                  type="date"
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-gray-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Płeć biologiczna
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-gray-800"
                >
                  <option value="MALE">Mężczyzna</option>
                  <option value="FEMALE">Kobieta</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Wzrost (cm)
                </label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-gray-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Waga (kg)
                </label>
                <input
                  type="text"
                  value={inputWeight}
                  onChange={(e) => handleWeightChange(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-gray-800"
                />
              </div>
            </div>

            <div className="mt-5 space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Aktywność fizyczna
              </label>
              <div className="relative">
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all appearance-none text-gray-800"
                >
                  <option value="LOW">Niski (siedzący tryb życia)</option>
                  <option value="MODERATE">
                    Umiarkowany (spacery, lekki trening)
                  </option>
                  <option value="HIGH">
                    Wysoki (regularny sport, praca fizyczna)
                  </option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </div>
              </div>
            </div>
          </section>

          <hr className="border-gray-100" />

          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xs uppercase tracking-wider text-gray-500 font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Profil Kliniczny
              </h2>
              <span className="text-[10px] tracking-wide uppercase text-emerald-600 bg-emerald-50 px-2 py-1 rounded font-bold">
                Wpływ na normy
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ConditionCard
                label="Stan Przedcukrzycowy"
                subtext="Podwyższony cukier (nie cukrzyca)."
                icon={Activity}
                value={hasPrediabetes}
                onChange={setHasPrediabetes}
              />
              <ConditionCard
                label="Cukrzyca"
                subtext="Cukrzyca typu 1 lub 2."
                icon={Droplet}
                value={hasDiabetes}
                onChange={setHasDiabetes}
              />
              <ConditionCard
                label="Nadciśnienie"
                subtext="Leczysz się na nadciśnienie."
                icon={Gauge}
                value={hasHypertension}
                onChange={setHasHypertension}
              />
              <ConditionCard
                label="Choroby Serca (CVD)"
                subtext="Przebyty zawał, choroba wieńcowa."
                icon={HeartPulse}
                value={hasHeartDisease}
                onChange={setHasHeartDisease}
              />
              <div className="sm:col-span-2 lg:col-span-1">
                <ConditionCard
                  label="Choroby Nerek (CKD)"
                  subtext="Przewlekła niewydolność nerek."
                  icon={Stethoscope}
                  value={hasKidneyDisease}
                  onChange={setHasKidneyDisease}
                />
              </div>
            </div>
          </section>

          <div className="pt-2">
            <button
              onClick={handleSubmit}
              className="group w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-200 hover:shadow-emerald-300 flex items-center justify-center gap-2"
            >
              <span>Zakończ konfigurację</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-center text-xs text-gray-400 mt-4">
              Twoje dane są przetwarzane zgodnie z polityką prywatności.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
