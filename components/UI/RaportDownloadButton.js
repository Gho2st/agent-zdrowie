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

  // Obliczanie różnicy dni
  const getDaysDifference = (start, end) => {
    const d1 = new Date(start);
    const d2 = new Date(end);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleDownload = async (overrideFrom = null, overrideTo = null) => {
    if (status !== "authenticated") {
      toast.error("Musisz być zalogowany, aby pobrać raport.");
      return;
    }

    // Ustalanie finalnych dat
    let finalFrom = typeof overrideFrom === "string" ? overrideFrom : dateFrom;
    let finalTo = typeof overrideTo === "string" ? overrideTo : dateTo;

    // Jeśli user nie wpisał nic, a kliknął "Pobierz PDF"
    // domyślnie ustawiamy ostatni rok
    if (!finalFrom && !finalTo && !overrideFrom) {
      const today = new Date();
      finalTo = today.toISOString().split("T")[0];
      const yearAgo = new Date();
      yearAgo.setFullYear(today.getFullYear() - 1);
      finalFrom = yearAgo.toISOString().split("T")[0];
      toast("Domyślnie wybrano okres ostatniego roku.", { icon: "ℹ️" });
    }

    // Walidacja logiczna
    if (finalFrom && finalTo && new Date(finalFrom) > new Date(finalTo)) {
      toast.error("Data „od” nie może być późniejsza niż „do”.");
      return;
    }

    //  Walidacja długości okresu (Max 366 dni), margines błędu + lata przestępne
    if (finalFrom && finalTo) {
      const days = getDaysDifference(finalFrom, finalTo);
      if (days > 366) {
        toast.error("Maksymalny okres raportu to 1 rok (365 dni).");
        return;
      }
    }

    setIsLoading(true);

    try {
      const payload = { dateFrom: finalFrom, dateTo: finalTo };

      const response = await fetch("/api/raport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Błąd serwera");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const fileName = `Raport_${finalFrom}_${finalTo}.pdf`;

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Raport pobrany!");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Nie udało się wygenerować raportu");
    } finally {
      setIsLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 max-w-2xl mx-auto">
      <h3 className="text-xl font-semibold mb-6 flex items-center gap-3 text-emerald-700">
        <Calendar size={24} />
        Raport (Max. 1 rok)
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data od
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            max={dateTo || today}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data do
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            min={dateFrom}
            max={today}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleDownload}
          disabled={isLoading || status !== "authenticated"}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : <FileDown />}
          Pobierz PDF
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={() => {
            const end = new Date();
            const start = new Date();
            start.setFullYear(end.getFullYear() - 1); // Cofamy dokładnie o 1 rok

            const dateEndStr = end.toISOString().split("T")[0];
            const dateStartStr = start.toISOString().split("T")[0];

            setDateFrom(dateStartStr);
            setDateTo(dateEndStr);

            handleDownload(dateStartStr, dateEndStr);
          }}
          className="
            px-6 py-3.5 border border-gray-300 rounded-lg 
            hover:bg-gray-50 transition-colors text-gray-700 font-medium
            disabled:opacity-50 disabled:cursor-not-allowed
            whitespace-nowrap
          "
        >
          Ostatni rok
        </button>
      </div>
    </div>
  );
}
