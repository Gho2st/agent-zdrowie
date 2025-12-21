"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, FileDown } from "lucide-react";
import toast from "react-hot-toast";

export default function RaportDownloadButton() {
  const { status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDownload = async () => {
    if (status !== "authenticated") {
      toast.error("Musisz być zalogowany, aby pobrać raport.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/raport", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Nie udało się wygenerować raportu.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // 1. Pobieramy dzisiejszą datę w formacie RRRR-MM-DD
      const date = new Date().toISOString().slice(0, 10);

      // 2. Tworzymy dynamiczną nazwę pliku
      const fileName = `Raport_Medyczny_${date}.pdf`;

      const link = document.createElement("a");
      link.href = url;
      // 3. Przypisujemy dynamiczną nazwę
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      toast.success("Raport został pobrany!");
    } catch (err) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Błąd pobierania raportu.");
      }
      toast.error("Wystąpił błąd podczas pobierania.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      <button
        onClick={handleDownload}
        disabled={isLoading || status === "loading"}
        className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 justify-center disabled:opacity-50 self-center"
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" size={18} />
            Generowanie PDF...
          </>
        ) : (
          <>
            <FileDown size={18} />
            Pobierz raport PDF
          </>
        )}
      </button>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
