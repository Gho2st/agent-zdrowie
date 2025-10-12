"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

export default function RejestracjaDodatkowa() {
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState("M");
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(70);
  const [inputWeight, setInputWeight] = useState("70");
  const [activityLevel, setActivityLevel] = useState("umiarkowany");
  const [conditions, setConditions] = useState([]);
  const [pregnancy, setPregnancy] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const { status, update } = useSession();

  // Usuwanie ciąży przy zmianie płci na mężczyznę
  useEffect(() => {
    if (gender === "M" && pregnancy) {
      setPregnancy(false);
    }
  }, [gender, pregnancy]);

  useEffect(() => {
    const verify = async () => {
      if (status === "unauthenticated") {
        router.replace("/logowanie");
        return;
      }

      if (status === "authenticated") {
        try {
          const res = await fetch(`/api/user/profile-complete/`);
          if (!res.ok) {
            throw new Error("Błąd pobierania danych profilu");
          }
          const data = await res.json();

          if (data.complete) {
            router.push("/profil");
            return;
          }
        } catch (e) {
          console.error("❌ Błąd pobierania danych profilu:", e);
          toast.error("Błąd weryfikacji profilu");
        }
      }

      setChecking(false);
    };

    verify();
  }, [status, router]);

  const handleConditionChange = (condition) => {
    setConditions((prev) =>
      prev.includes(condition)
        ? prev.filter((c) => c !== condition)
        : [...prev, condition]
    );
  };

  const handlePregnancyChange = () => {
    setPregnancy((prev) => !prev);
  };

  const handleWeightChange = (value) => {
    setInputWeight(value);
    const parsedWeight = parseFloat(value);
    if (!isNaN(parsedWeight)) {
      setWeight(parsedWeight);
    }
  };

  const handleSubmit = async () => {
    // Walidacja danych
    if (!birthdate || isNaN(new Date(birthdate).getTime())) {
      toast.error("Podaj prawidłową datę urodzenia");
      return;
    }
    if (height < 50 || height > 250) {
      toast.error("Wzrost musi być między 50 a 250 cm");
      return;
    }
    if (weight < 20 || weight > 300) {
      toast.error("Waga musi być między 20 a 300 kg");
      return;
    }
    if (!["niski", "umiarkowany", "wysoki"].includes(activityLevel)) {
      toast.error("Wybierz prawidłowy poziom aktywności");
      return;
    }
    if (gender === "M" && pregnancy) {
      toast.error("Ciąża możliwa tylko dla kobiet");
      setPregnancy(false);
      return;
    }
    if (pregnancy) {
      const age = new Date().getFullYear() - new Date(birthdate).getFullYear();
      if (age < 15 || age > 50) {
        toast.error("Ciąża możliwa tylko dla kobiet w wieku 15-50 lat");
        return;
      }
    }

    const res = await fetch("/api/user/setup", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        birthdate,
        gender,
        height,
        weight,
        activityLevel,
        conditions: conditions.join(","),
        pregnancy,
      }),
    });

    if (res.ok) {
      await update();
      toast.success("Dane zapisane pomyślnie");
      router.push("/profil");
      router.refresh();
    } else {
      const errorData = await res.json();
      toast.error(errorData.error || "Błąd zapisu danych");
    }
  };

  if (status === "loading" || checking) return null;

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-xl shadow-md">
      <h1 className="text-xl font-bold mb-4">Uzupełnij dane zdrowotne</h1>

      <label className="block mb-2">Data urodzenia</label>
      <input
        type="date"
        value={birthdate}
        onChange={(e) => setBirthdate(e.target.value)}
        className="w-full p-2 border rounded mb-4"
      />

      <label className="block mb-2">Płeć</label>
      <select
        value={gender}
        onChange={(e) => setGender(e.target.value)}
        className="w-full p-2 border rounded mb-4"
      >
        <option value="M">Mężczyzna</option>
        <option value="K">Kobieta</option>
      </select>

      <label className="block mb-2">Wzrost (cm)</label>
      <input
        type="number"
        value={height}
        onChange={(e) => setHeight(parseInt(e.target.value) || 170)}
        className="w-full p-2 border rounded mb-4"
      />

      <label className="block mb-2">Waga (kg)</label>
      <input
        type="text"
        value={inputWeight}
        onChange={(e) => handleWeightChange(e.target.value)}
        className="w-full p-2 border rounded mb-4"
      />

      <label className="block mb-2">Poziom aktywności fizycznej</label>
      <select
        value={activityLevel}
        onChange={(e) => setActivityLevel(e.target.value)}
        className="w-full p-2 border rounded mb-4"
      >
        <option value="niski">Niski (brak regularnego ruchu)</option>
        <option value="umiarkowany">
          Umiarkowany (np. spacery, lekki sport)
        </option>
        <option value="wysoki">Wysoki (regularny sport, treningi)</option>
      </select>

      <label className="block mb-2">Stan zdrowia</label>
      <div className="mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={conditions.includes("cukrzyca")}
            onChange={() => handleConditionChange("cukrzyca")}
            className="mr-2"
          />
          Cukrzyca
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={conditions.includes("nadciśnienie")}
            onChange={() => handleConditionChange("nadciśnienie")}
            className="mr-2"
          />
          Nadciśnienie
        </label>
      </div>

      {gender === "K" && (
        <div className="mb-4">
          <label className="block mb-2">Ciąża</label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={pregnancy}
              onChange={handlePregnancyChange}
              className="mr-2"
            />
            Jestem w ciąży
          </label>
        </div>
      )}

      <button
        onClick={handleSubmit}
        className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
      >
        Zapisz i przejdź dalej
      </button>
    </div>
  );
}
