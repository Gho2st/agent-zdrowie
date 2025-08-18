"use client";

import Container from "@/components/UI/Container/Container";
import Header from "@/components/UI/Headers/Header";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MedicationsAndConditions from "./Medications";
import Age from "./Age";
import Norms from "./Norms";
import toast from "react-hot-toast";
import { Hand, LogOut } from "lucide-react";

// Typ dla danych profilu
type CombinedNorms = {
  birthdate: string | Date;
  height: number;
  weight: number;
  bmi?: number;
  medications?: string;
  conditions?: string; // Ciąg z bazy (np. "cukrzyca,astma")
  activityLevel?: string; // "niski", "umiarkowany", "wysoki"
  systolicMin?: number;
  systolicMax?: number;
  diastolicMin?: number;
  diastolicMax?: number;
  glucoseFastingMin?: number;
  glucoseFastingMax?: number;
  glucosePostMealMax?: number;
  glucosePrediabetesFastingMin?: number;
  glucosePrediabetesFastingMax?: number;
  weightMin?: number;
  weightMax?: number;
  pulseMin?: number;
  pulseMax?: number;
};

// Typ dla MedicationsAndConditions
type NormsState = {
  medications?: string;
  conditions: string[]; // Tablica dla interfejsu
  activityLevel?: string;
};

export default function Profil() {
  const { data: session } = useSession();
  const router = useRouter();
  const [editingHeight, setEditingHeight] = useState(false);
  const [editingWeight, setEditingWeight] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [norms, setNorms] = useState<CombinedNorms>({
    birthdate: new Date().toISOString(),
    height: 0,
    weight: 0,
    medications: "",
    conditions: "",
    activityLevel: "",
  });

  // Konwersja conditions na tablicę dla MedicationsAndConditions
  const medicationNorms: NormsState = {
    medications: norms.medications,
    conditions: norms.conditions
      ? norms.conditions.split(",").filter(Boolean)
      : [],
    activityLevel: norms.activityLevel,
  };

  // Dostosowanie setNorms dla MedicationsAndConditions
  const setMedicationNorms: React.Dispatch<React.SetStateAction<NormsState>> = (
    action
  ) => {
    setNorms((prev) => {
      const result =
        typeof action === "function" ? action(medicationNorms) : action;
      return {
        ...prev,
        medications: result.medications ?? "",
        conditions: result.conditions.join(","),
        activityLevel: result.activityLevel ?? "",
      };
    });
  };

  useEffect(() => {
    const fetchUserNorms = async () => {
      const res = await fetch("/api/user/norms");
      if (res.ok) {
        const data: CombinedNorms = await res.json();
        setNorms(data);
      } else {
        toast.error("Błąd pobierania danych profilu");
      }
      setIsLoading(false);
    };

    fetchUserNorms();
  }, [session, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNorms((prev) => ({
      ...prev,
      [name]:
        name === "height" || name === "weight" ? parseFloat(value) || 0 : value,
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
        const updatedData: CombinedNorms = await refreshed.json();
        setNorms(updatedData);
        toast.success("Zaktualizowano wzrost");
        setEditingHeight(false);
      }
    } else {
      toast.error("Błąd aktualizacji wzrostu");
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
        const updatedData: CombinedNorms = await refreshed.json();
        setNorms(updatedData);
        toast.success("Zaktualizowano wagę");
        setEditingWeight(false);
      }
    } else {
      toast.error("Błąd aktualizacji wagi");
    }
  };

  if (isLoading || !norms) {
    return (
      <Container>
        <Header text="Mój Profil" />
        <div className="mt-20 text-center text-gray-500">
          Ładowanie danych profilu...
        </div>
      </Container>
    );
  }

  return (
    <Container>
      {session && (
        <>
          <div className="flex justify-between gap-4 flex-row items-center">
            <div className="flex items-center gap-4">
              <Image
                src={session.user?.image ?? ""}
                alt="avatar"
                width={500}
                height={500}
                className="w-16 h-16 rounded-full my-3"
              />
              <div>
                <div className="text-sm flex items-center gap-1 font-semibold text-gray-900">
                  Witaj <Hand className="text-blue-500 w-4" />
                </div>
                <p className="font-bold">{session.user?.name}</p>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="text-red-500 underline cursor-pointer"
            >
              <LogOut className="md:w-10 md:h-10 2xl:w-12 2xl:h-12" />
            </button>
          </div>
        </>
      )}

      <div className="grid sm:grid-cols-2 gap-8 mt-10">
        <div className="bg-white/30 backdrop-blur-lg border border-white/20 p-6 shadow-lg rounded-2xl">
          <Age
            norms={{
              birthdate: norms.birthdate,
              height: norms.height,
              weight: norms.weight,
              bmi: norms.bmi,
            }}
            saveHeight={saveHeight}
            saveWeight={saveWeight}
            editingWeight={editingWeight}
            setEditingWeight={setEditingWeight}
            editingHeight={editingHeight}
            setEditingHeight={setEditingHeight}
          />
        </div>

        <MedicationsAndConditions
          norms={medicationNorms}
          setNorms={setMedicationNorms}
        />

        <Norms
          norms={
            Object.fromEntries(
              Object.entries(norms).filter(([, val]) => typeof val === "number")
            ) as Record<string, number>
          }
          handleChange={handleChange}
        />
      </div>
    </Container>
  );
}
