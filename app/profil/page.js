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

export default function Profil() {
  const { data: session } = useSession();
  const router = useRouter();
  const [editingHeight, setEditingHeight] = useState(false);
  const [editingWeight, setEditingWeight] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [norms, setNorms] = useState({
    birthdate: new Date().toISOString(),
    height: 0,
    weight: 0,
    medications: "",
    conditions: "", // Ciąg z bazy
    activityLevel: "",
    pregnancy: false,
  });

  // Konwersja norms.conditions (ciąg) na tablicę dla MedicationsAndConditions
  const medicationNorms = {
    medications: norms.medications,
    conditions: norms.conditions
      ? norms.conditions.split(",").filter(Boolean)
      : [],
    activityLevel: norms.activityLevel,
    pregnancy: norms.pregnancy,
  };

  // Dostosowanie setNorms dla MedicationsAndConditions, aby aktualizować norms
  const setMedicationNorms = (action) => {
    setNorms((prev) => {
      const result =
        typeof action === "function" ? action(medicationNorms) : action;
      return {
        ...prev,
        medications: result.medications ?? "",
        conditions: result.conditions.join(","), // Konwersja z powrotem na ciąg
        activityLevel: result.activityLevel ?? "",
        pregnancy: result.pregnancy ?? false,
      };
    });
  };

  useEffect(() => {
    const fetchUserNorms = async () => {
      // Weryfikacja sesji jest pominięta, ponieważ useSession() zarządza stanem
      // a komponent jest chroniony przez autoryzację na poziomie Next.js.

      const res = await fetch("/api/user/norms");
      if (res.ok) {
        const data = await res.json();
        // Wypełnianie stanu norms danymi z serwera
        setNorms((prev) => ({
          ...prev,
          ...data,
          // Upewnienie się, że conditions jest traktowane jako ciąg z bazy
          conditions: data.conditions ?? "",
        }));
      } else {
        toast.error("Błąd pobierania danych profilu");
      }
      setIsLoading(false);
    };

    if (session) {
      fetchUserNorms();
    }
  }, [session]); // Zależność od sesji, aby pobrać dane po zalogowaniu

  // Obsługa zmian w polach numerycznych norm (używane przez Norms)
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Sprawdzanie, czy pole jest numeryczne i konwersja, jeśli to konieczne
    const isNumericField = [
      "height",
      "weight",
      "systolicMin",
      "systolicMax",
      "diastolicMin",
      "diastolicMax",
      "glucoseFastingMin",
      "glucoseFastingMax",
      "glucosePostMealMax",
      "glucosePrediabetesFastingMin",
      "glucosePrediabetesFastingMax",
      "weightMin",
      "weightMax",
      "pulseMin",
      "pulseMax",
    ].includes(name);

    let finalValue = value;
    if (isNumericField) {
      // Używamy parseFloat dla wag, wzrostu i norm, które mogą mieć wartości dziesiętne,
      // ale jeśli jest to pusty string, ustawiamy null lub pusty string, aby móc go zapisać jako null w DB
      finalValue = value === "" ? "" : parseFloat(value);
      if (isNaN(finalValue)) finalValue = "";
    }

    setNorms((prev) => ({
      ...prev,
      [name]: finalValue,
    }));
  };

  const saveHeight = async (newHeight) => {
    const res = await fetch("/api/user/norms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ height: newHeight }),
    });
    if (res.ok) {
      const updatedData = await res.json();
      setNorms((prev) => ({ ...prev, ...updatedData }));
      toast.success("Zaktualizowano wzrost");
      setEditingHeight(false);
    } else {
      toast.error("Błąd aktualizacji wzrostu");
    }
  };

  const saveWeight = async (newWeight) => {
    const res = await fetch("/api/user/norms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weight: newWeight }),
    });
    if (res.ok) {
      const updatedData = await res.json();
      setNorms((prev) => ({ ...prev, ...updatedData }));
      toast.success("Zaktualizowano wagę");
      setEditingWeight(false);
    } else {
      toast.error("Błąd aktualizacji wagi");
    }
  };

  if (isLoading || !session) {
    return (
      <Container>
        <Header text="Mój Profil" />
        <div className="mt-20 text-center text-gray-500">
          Ładowanie danych profilu...
        </div>
      </Container>
    );
  }

  // Przygotowanie danych numerycznych dla komponentu Norms
  const numericNorms = Object.fromEntries(
    Object.entries(norms).filter(
      ([, val]) => typeof val === "number" || val === null || val === ""
    )
  );

  return (
    <Container>
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
          gender={norms.gender}
        />

        <Norms norms={numericNorms} handleChange={handleChange} />
      </div>
    </Container>
  );
}
