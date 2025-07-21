"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, FileDown } from "lucide-react";
import toast from "react-hot-toast";

export default function RaportDownloadButton() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      const link = document.createElement("a");
      link.href = url;
      link.download = "raport-zdrowotny.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Błąd pobierania raportu.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleDownload}
        disabled={isLoading || status === "loading"}
        className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
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
