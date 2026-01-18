"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, FileDown, Calendar } from "lucide-react";
import toast from "react-hot-toast";

export default function RaportDownloadForm() {
  const { status } = useSession();

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    if (status !== "authenticated") {
      toast.error("Musisz być zalogowany, aby pobrać raport.");
      return;
    }

    if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) {
      toast.error("Data „od” nie może być późniejsza niż „do”.");
      return;
    }

    setIsLoading(true);

    try {
      const payload = {};
      if (dateFrom) payload.dateFrom = dateFrom;
      if (dateTo) payload.dateTo = dateTo;

      const response = await fetch("/api/raport", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          errorText || "Błąd serwera podczas generowania raportu",
        );
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const today = new Date().toISOString().slice(0, 10);
      let rangePart = "";
      if (dateFrom || dateTo) {
        rangePart = `_${dateFrom || "od_początku"}-${dateTo || "do_teraz"}`;
      }
      const fileName = `Raport_Zdrowotny${rangePart}_${today}.pdf`;

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Raport został pobrany pomyślnie!");
    } catch (err) {
      console.error("Błąd podczas pobierania:", err);
      toast.error("Nie udało się wygenerować raportu");
    } finally {
      setIsLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 max-w-2xl mx-auto">
      <h3 className="text-xl font-semibold mb-6 flex items-center gap-3 text-emerald-700">
        <Calendar size={24} />
        Generuj raport zdrowotny za wybrany okres
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        {/* Data OD */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data początkowa (od)
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            max={dateTo || today}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg 
                       focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 
                       transition-colors"
          />
        </div>

        {/* Data DO */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data końcowa (do)
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            min={dateFrom}
            max={today}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg 
                       focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 
                       transition-colors"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleDownload}
          disabled={isLoading || status !== "authenticated"}
          className={`
            flex-1 flex items-center justify-center gap-2 px-6 py-3.5 
            bg-emerald-600 hover:bg-emerald-700 
            text-white font-medium rounded-lg shadow-sm 
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Generuję raport...
            </>
          ) : (
            <>
              <FileDown className="h-5 w-5" />
              Pobierz raport PDF
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setDateFrom("");
            setDateTo("");
            handleDownload();
          }}
          disabled={isLoading}
          className="
            px-6 py-3.5 border border-gray-300 rounded-lg 
            hover:bg-gray-50 transition-colors text-gray-700 font-medium
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          Cała historia
        </button>
      </div>
    </div>
  );
}
