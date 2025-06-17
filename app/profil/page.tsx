"use client";

import Container from "@/components/UI/Container/Container";
import Header from "@/components/UI/Headers/Header";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Profil() {
  const { data: session } = useSession();
  const router = useRouter();

  const [editingNorms, setEditingNorms] = useState(false);
  const [editingAge, setEditingAge] = useState(false);
  const [norms, setNorms] = useState({
    age: 30,
    systolicMin: 100,
    systolicMax: 130,
    diastolicMin: 60,
    diastolicMax: 85,
    glucoseMin: 70,
    glucoseMax: 105,
    weightMin: 55,
    weightMax: 80,
  });

  useEffect(() => {
    if (!session) {
      router.push("/logowanie");
      return;
    }

    const fetchUserNorms = async () => {
      const res = await fetch("/api/user/norms");
      if (res.ok) {
        const data = await res.json();
        setNorms((prev) => ({ ...prev, ...data }));
      }
    };

    fetchUserNorms();
  }, [session, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNorms((prev) => ({
      ...prev,
      [name]: name === "age" ? parseInt(value) : parseFloat(value),
    }));
  };

  const saveAge = async () => {
    const res = await fetch("/api/user/norms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ age: norms.age }),
    });
    if (res.ok) {
      const refreshed = await fetch("/api/user/norms");
      if (refreshed.ok) {
        const updatedData = await refreshed.json();
        setNorms(updatedData);
      }
      alert("Zaktualizowano wiek i przeliczono normy");
      setEditingAge(false);
    }
  };

  const saveNorms = async () => {
    const {
      systolicMin,
      systolicMax,
      diastolicMin,
      diastolicMax,
      glucoseMin,
      glucoseMax,
      weightMin,
      weightMax,
    } = norms;

    const res = await fetch("/api/user/norms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systolicMin,
        systolicMax,
        diastolicMin,
        diastolicMax,
        glucoseMin,
        glucoseMax,
        weightMin,
        weightMax,
      }),
    });

    if (res.ok) {
      alert("Zapisano normy");
      setEditingNorms(false);
    }
  };

  if (!session) return null;

  return (
    <Container>
      <Header text="Profil" />

      <div className="my-10 max-w-xl space-y-6">
        <div>
          <p className="text-xl font-bold">Witaj, {session.user?.name}</p>
          <Image
            src={session.user?.image ?? ""}
            alt="avatar"
            width={200}
            height={200}
            className="w-16 h-16 rounded-full my-3"
          />
          <button
            onClick={() => signOut()}
            className="text-sm text-red-500 underline"
          >
            Wyloguj się
          </button>
        </div>

        {/* 🔹 Sekcja: Wiek */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <p className="font-semibold mb-4">Twój wiek</p>

          {!editingAge ? (
            <div className="flex justify-between items-center">
              <span className="text-lg">{norms.age} lat</span>
              <button
                onClick={() => setEditingAge(true)}
                className="text-blue-600 underline"
              >
                Edytuj
              </button>
            </div>
          ) : (
            <div className="flex gap-4 items-center">
              <input
                type="number"
                name="age"
                value={isNaN(norms.age) ? "" : norms.age}
                onChange={handleChange}
                className="w-24 p-2 border rounded"
              />
              <button
                onClick={saveAge}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Zapisz
              </button>
              <button
                onClick={() => setEditingAge(false)}
                className="text-gray-500 underline"
              >
                Anuluj
              </button>
            </div>
          )}
        </div>

        {/* 🔹 Sekcja: Normy */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <p className="font-semibold mb-4">
            Masz własne normy od lekarza? Możesz je tutaj zaktualizować:
          </p>

          {!editingNorms ? (
            <button
              className="bg-green-600 text-white px-4 py-2 rounded-lg"
              onClick={() => setEditingNorms(true)}
            >
              Edytuj normy
            </button>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  "systolicMin",
                  "systolicMax",
                  "diastolicMin",
                  "diastolicMax",
                  "glucoseMin",
                  "glucoseMax",
                  "weightMin",
                  "weightMax",
                ].map((field) => (
                  <label key={field} className="block">
                    {field}:
                    <input
                      type="number"
                      name={field}
                      value={norms[field as keyof typeof norms] || ""}
                      onChange={handleChange}
                      className="block w-full mt-1 border px-3 py-2 rounded-md"
                    />
                  </label>
                ))}
              </div>

              <div className="flex gap-4 mt-4">
                <button
                  onClick={saveNorms}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  Zapisz
                </button>
                <button
                  onClick={() => setEditingNorms(false)}
                  className="text-gray-500 underline"
                >
                  Anuluj
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}
