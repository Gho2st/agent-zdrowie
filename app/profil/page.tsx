"use client";

import Container from "@/components/UI/Container/Container";
import Header from "@/components/UI/Headers/Header";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Medications from "./Medications";
import Norms from "./Norms";
import Age from "./Age";
import toast from "react-hot-toast";

export default function Profil() {
  const { data: session } = useSession();
  const router = useRouter();
  const [editingHeight, setEditingHeight] = useState(false);
  const [editingWeight, setEditingWeight] = useState(false);
  const [norms, setNorms] = useState<any>({});

  useEffect(() => {
    if (!session) {
      router.push("/logowanie");
      return;
    }

    const fetchUserNorms = async () => {
      const res = await fetch("/api/user/norms");
      if (res.ok) {
        const data = await res.json();
        setNorms(data);
      }
    };

    fetchUserNorms();
  }, [session, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNorms((prev: any) => ({
      ...prev,
      [name]:
        name === "weight" || name === "height"
          ? parseInt(value)
          : parseFloat(value),
    }));
  };

  const saveHeight = async (newHeight: number) => {
    const res = await fetch("/api/user/norms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ height: newHeight }),
    });
    if (res.ok) {
      const refreshed = await fetch("/api/user/norms");
      if (refreshed.ok) {
        const updatedData = await refreshed.json();
        setNorms(updatedData);
        toast.success("Zaktualizowano wzrost");
        setEditingHeight(false);
      }
    }
  };

  const saveWeight = async (newWeight: number) => {
    const res = await fetch("/api/user/norms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weight: newWeight }),
    });
    if (res.ok) {
      const refreshed = await fetch("/api/user/norms");
      if (refreshed.ok) {
        const updatedData = await refreshed.json();
        setNorms(updatedData);
        toast.success("Zaktualizowano wagę");
        setEditingWeight(false);
      }
    }
  };

  if (!session) return null;

  return (
    <Container>
      <Header text="Mój Profil" />
      <button
        onClick={() => signOut()}
        className="text-sm text-red-500 underline cursor-pointer"
      >
        Wyloguj się
      </button>
      <div className="grid grid-cols-2 gap-8 mt-20">
        <div className="bg-white p-10 shadow-lg rounded-2xl">
          <p className="text-xl font-bold">{session.user?.name}</p>
          <Image
            src={session.user?.image ?? ""}
            alt="avatar"
            width={500}
            height={500}
            className="w-16 h-16 rounded-full my-3"
          />

          {/* 🔹 Sekcja: Wiek, wzrost, waga */}
          <Age
            norms={norms}
            saveHeight={saveHeight}
            saveWeight={saveWeight}
            editingWeight={editingWeight}
            setEditingWeight={setEditingWeight}
            editingHeight={editingHeight}
            setEditingHeight={setEditingHeight}
          />
        </div>

        {/* 🔹 Sekcja: Leki */}
        <Medications norms={norms} setNorms={setNorms} />

        {/* 🔹 Sekcja: Normy */}
        <Norms norms={norms} handleChange={handleChange} setNorms={setNorms} />
      </div>
    </Container>
  );
}
