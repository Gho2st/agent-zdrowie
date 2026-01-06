"use client";

import Container from "@/components/UI/Container/Container";
import Header from "@/components/UI/Headers/Header";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import MedicationsAndConditions from "./Medications";
import Age from "./Age";
import Norms from "./Norms";
import toast from "react-hot-toast";
import { Hand, LogOut } from "lucide-react";
import RaportDownloadButton from "@/components/UI/RaportDownloadButton";
import { FileText } from "lucide-react";

export default function Profil() {
  const { data: session } = useSession();
  const [editingHeight, setEditingHeight] = useState(false);
  const [editingWeight, setEditingWeight] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [norms, setNorms] = useState({
    birthdate: new Date().toISOString(),
    height: 0,
    weight: 0,
    medications: "",
    conditions: "",
    activityLevel: "",
    hasDiabetes: false,
    hasPrediabetes: false,
    hasHypertension: false,
    hasHeartDisease: false,
    hasKidneyDisease: false,
  });

  const handleDataUpdate = (newData) => {
    setNorms((prev) => ({
      ...prev,
      ...newData,
      conditions: Array.isArray(newData.conditions)
        ? newData.conditions.join(",")
        : newData.conditions ?? prev.conditions,
    }));
  };

  const medicationNorms = {
    medications: norms.medications,
    conditions: norms.conditions
      ? norms.conditions.split(",").filter(Boolean)
      : [],
    activityLevel: norms.activityLevel,
    pregnancy: norms.pregnancy,
    hasDiabetes: norms.hasDiabetes,
    hasPrediabetes: norms.hasPrediabetes,
    hasHypertension: norms.hasHypertension,
    hasHeartDisease: norms.hasHeartDisease,
    hasKidneyDisease: norms.hasKidneyDisease,
  };

  const setMedicationNorms = (action) => {
    setNorms((prev) => {
      const currentMedNorms = {
        medications: prev.medications,
        conditions: prev.conditions
          ? prev.conditions.split(",").filter(Boolean)
          : [],
        activityLevel: prev.activityLevel,
        hasDiabetes: prev.hasDiabetes,
        hasPrediabetes: prev.hasPrediabetes,
        hasHypertension: prev.hasHypertension,
        hasHeartDisease: prev.hasHeartDisease,
        hasKidneyDisease: prev.hasKidneyDisease,
      };

      const result =
        typeof action === "function" ? action(currentMedNorms) : action;

      return {
        ...prev,
        medications: result.medications ?? "",
        conditions: Array.isArray(result.conditions)
          ? result.conditions.join(",")
          : "",
        activityLevel: result.activityLevel ?? "",
        hasDiabetes: result.hasDiabetes ?? false,
        hasPrediabetes: result.hasPrediabetes ?? false,
        hasHypertension: result.hasHypertension ?? false,
        hasHeartDisease: result.hasHeartDisease ?? false,
        hasKidneyDisease: result.hasKidneyDisease ?? false,
      };
    });
  };

  useEffect(() => {
    const fetchUserNorms = async () => {
      const res = await fetch("/api/user/norms");
      if (res.ok) {
        const data = await res.json();
        setNorms((prev) => ({
          ...prev,
          ...data,
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
  }, [session]);

  const handleChange = (e) => {
    const { name, value } = e.target;
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
      handleDataUpdate(updatedData);
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
      handleDataUpdate(updatedData);
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

        <MedicationsAndConditions
          norms={medicationNorms}
          setNorms={setMedicationNorms}
          onUpdate={handleDataUpdate}
        />

        <Norms
          norms={numericNorms}
          handleChange={handleChange}
          onUpdate={handleDataUpdate}
        />

        <div className="">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-4 text-center">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-emerald-600">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-gray-800 text-sm mb-1">
              Twój Raport
            </h4>
            <p className="text-xs text-gray-500 mb-3 leading-snug">
              Pobierz podsumowanie PDF.
            </p>
            <div className="[&>button]:w-full [&>button]:py-2 [&>button]:text-xs">
              <RaportDownloadButton />
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
