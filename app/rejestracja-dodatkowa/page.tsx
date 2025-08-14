"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { signIn } from "next-auth/react";

export default function RejestracjaDodatkowa() {
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState("M");
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(70);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  const { status } = useSession();
  const { update } = useSession();

  useEffect(() => {
    const verify = async () => {
      if (status === "unauthenticated") {
        router.replace("/logowanie");
        return;
      }

      if (status === "authenticated") {
        try {
          const res = await fetch(`/api/user/profile-complete/`);
          const data = await res.json();

          if (data.complete) {
            return;
          }
        } catch (e) {
          console.error("❌ Błąd pobierania danych profilu:", e);
        }
      }

      setChecking(false);
    };

    verify();
  }, [status, router]);

  const handleSubmit = async () => {
    const res = await fetch("/api/user/setup", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ birthdate, gender, height, weight }),
    });

    if (res.ok) {
      await update();
      router.push("/profil");
    } else {
      toast.error("Błąd zapisu");
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
        onChange={(e) => setHeight(parseInt(e.target.value))}
        className="w-full p-2 border rounded mb-4"
      />

      <label className="block mb-2">Waga (kg)</label>
      <input
        type="number"
        value={weight}
        onChange={(e) => setWeight(parseFloat(e.target.value))}
        className="w-full p-2 border rounded mb-4"
      />

      <button
        onClick={handleSubmit}
        className="bg-green-600 text-white py-2 px-4 rounded"
      >
        Zapisz i przejdź dalej
      </button>
    </div>
  );
}
