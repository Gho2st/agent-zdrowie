"use client";
import React, { useState, useMemo } from "react";
import {
  Heart,
  Droplet,
  Scale,
  Activity,
  Trash2,
  X,
  Check,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

// konfiguracja

const ITEMS_PER_PAGE = 12;

const MEASUREMENT_TYPES = {
  BLOOD_PRESSURE: {
    label: "Ciśnienie",
    icon: Activity,
    iconColor: "text-blue-500",
  },
  GLUCOSE: { label: "Cukier", icon: Droplet, iconColor: "text-red-500" },
  WEIGHT: { label: "Waga", icon: Scale, iconColor: "text-green-500" },
  HEART_RATE: { label: "Tętno", icon: Heart, iconColor: "text-purple-500" },
};

// normy
const getNormStatus = (m, n) => {
  if (!n) return "UNKNOWN";

  if (m.type === "BLOOD_PRESSURE") {
    const sys = m.systolic || m.value;
    const dia = m.diastolic || m.value2;
    if (sys == null || dia == null) return "UNKNOWN";
    if (sys > n.systolicMax || dia > n.diastolicMax) return "HIGH";
    if (sys < n.systolicMin || dia < n.diastolicMin) return "LOW";
    return "IN_RANGE";
  }

  const value = m.amount || m.value;
  const timing = m.timing;

  if (m.type === "GLUCOSE") {
    if (
      timing?.includes("przed") &&
      n.glucoseFastingMin != null &&
      n.glucoseFastingMax != null
    ) {
      if (value < n.glucoseFastingMin || value > n.glucoseFastingMax)
        return value < n.glucoseFastingMin ? "LOW" : "HIGH";
    }
    if (
      timing?.includes("po") &&
      n.glucosePostMealMax != null &&
      value > n.glucosePostMealMax
    )
      return "HIGH";
    return "IN_RANGE";
  }

  if (m.type === "WEIGHT" && n.weightMin != null && n.weightMax != null) {
    if (value < n.weightMin || value > n.weightMax)
      return value < n.weightMin ? "LOW" : "HIGH";
  }
  if (m.type === "HEART_RATE" && n.pulseMin != null && n.pulseMax != null) {
    if (value < n.pulseMin || value > n.pulseMax)
      return value < n.pulseMin ? "LOW" : "HIGH";
  }
  return "IN_RANGE";
};

const getPolishStatus = (s) =>
  ({
    HIGH: "Podwyższony",
    LOW: "Zbyt niski",
    IN_RANGE: "W normie",
    UNKNOWN: "Brak norm",
  }[s] || "Brak norm");
const getNormColor = (s) =>
  ({
    HIGH: "bg-red-500",
    LOW: "bg-orange-500",
    IN_RANGE: "bg-green-500",
    UNKNOWN: "bg-gray-400",
  }[s]);

// wyswietlanie wartosci
const getMeasurementDisplay = (m) => {
  switch (m.type) {
    case "BLOOD_PRESSURE":
      return `${m.systolic || m.value}/${m.diastolic || m.value2} ${
        m.unit || "mmHg"
      }`;
    case "GLUCOSE":
      return `${m.amount || m.value} ${m.unit || "mg/dL"}`;
    case "WEIGHT":
      return `${m.amount || m.value} ${m.unit || "kg"}`;
    case "HEART_RATE":
      return `${m.amount || m.value} ${m.unit || "bpm"}`;
    default:
      return "—";
  }
};

// komponent glowny
export default function ListaPomiarow({
  measurements = [],
  filterType,
  setFilterType,
  requestDelete,
  confirmDeleteId,
  setConfirmDeleteId,
  confirmDelete,
  norms,
}) {
  const [sortOrder, setSortOrder] = useState("dateDesc");
  const [currentPage, setCurrentPage] = useState(1);

  const handleFilterChange = (e) => {
    setFilterType(e.target.value);
    setCurrentPage(1);
  };

  const handleSortChange = (val) => {
    setSortOrder(val);
    setCurrentPage(1);
  };

  const processed = useMemo(() => {
    let list =
      filterType === "all"
        ? measurements
        : measurements.filter((m) => m.type === filterType);

    list = [...list].sort((a, b) => {
      if (sortOrder === "dateDesc")
        return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortOrder === "dateAsc")
        return new Date(a.createdAt) - new Date(b.createdAt);
      const va = a.amount || a.value || a.systolic || 0;
      const vb = b.amount || b.value || b.systolic || 0;
      return sortOrder === "valueDesc" ? vb - va : va - vb;
    });

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return {
      totalItems: list.length,
      paginated: list.slice(start, start + ITEMS_PER_PAGE),
    };
  }, [measurements, filterType, sortOrder, currentPage]);

  const totalPages = Math.ceil(processed.totalItems / ITEMS_PER_PAGE);

  const SortButton = ({ value, label }) => (
    <button
      onClick={() => handleSortChange(value)}
      className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors ${
        sortOrder === value
          ? "bg-blue-600 text-white"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }`}
    >
      {label}
      {sortOrder === value &&
        (value.includes("Desc") ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronUp className="w-4 h-4" />
        ))}
    </button>
  );

  return (
    <>
      {/* PANEL STEROWANIA */}
      <div className="mt-10  bg-white/30 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 shadow-lg">
        <h2 className="text-xl font-bold text-gray-800 mb-5">
          Opcje wyświetlania
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtr typu
            </label>
            <select
              value={filterType}
              onChange={handleFilterChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              <option value="all">Wszystkie ({measurements.length})</option>
              {Object.entries(MEASUREMENT_TYPES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sortowanie
            </label>
            <div className="flex flex-wrap gap-2">
              <SortButton value="dateDesc" label="Najnowsze" />
              <SortButton value="dateAsc" label="Najstarsze" />
              <SortButton value="valueDesc" label="Od najwyższej" />
              <SortButton value="valueAsc" label="Od najniższej" />
            </div>
          </div>
        </div>
      </div>

      {/* lista pomiarow */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6">
          Historia pomiarów ({processed.totalItems})
        </h2>

        {processed.paginated.length === 0 ? (
          <div className="text-center py-20 bg-white/30 rounded-2xl border-gray-300">
            <p className="text-gray-500 text-lg">
              Brak pomiarów do wyświetlenia
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {processed.paginated.map((m) => {
              const typeData = MEASUREMENT_TYPES[m.type] || {};
              const Icon = typeData.icon || Activity;
              const status = getNormStatus(m, norms);
              const color = getNormColor(status);

              return (
                <div
                  key={m.id}
                  className="group relative bg-white/30 border border-gray-200 rounded-2xl overflow-hidden
                             flex flex-col h-54 shadow-md hover:shadow-xl transition-shadow duration-300"
                >
                  {/* Pasek statusu */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-2 ${color}`}
                  />

                  <div className="flex-1 p-6 pl-8 flex flex-col justify-between">
                    {/* Nagłówek */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-7 h-7 ${
                            typeData.iconColor || "text-gray-500"
                          }`}
                        />
                        <h3 className="font-bold text-gray-800">
                          {typeData.label}
                        </h3>
                      </div>
                      <button
                        onClick={() => requestDelete(String(m.id))}
                        className="text-gray-400 hover:text-red-600 
                                   hover:bg-red-50 p-2 rounded-full transition-all duration-200"
                        title="Usuń"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Wartość główna */}
                    <p className="text-2xl font-extrabold text-gray-900 my-3 tracking-tight">
                      {getMeasurementDisplay(m)}
                    </p>

                    {/* Status + data */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Status:</span>
                        <span
                          className={`font-bold ${color.replace(
                            "bg-",
                            "text-"
                          )}`}
                        >
                          {getPolishStatus(status)}
                        </span>
                      </div>
                      <p className="text-gray-500">
                        {new Date(m.createdAt).toLocaleString("pl-PL", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    {/* Timing / notatka */}
                    <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-600 h-12 flex items-center">
                      {m.timing && m.type === "GLUCOSE" && (
                        <span className="flex items-center gap-1">
                          <Check className="w-4 h-4 text-green-600" />
                          <strong>{m.timing}</strong>
                        </span>
                      )}
                      {m.note && m.type === "BLOOD_PRESSURE" && (
                        <span className="flex items-center gap-1">
                          <Check className="w-4 h-4 text-green-600" />
                          Notatka: {m.note}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PAGINACJA */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-10">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-6 py-3 rounded-xl bg-white border border-gray-300 shadow-sm disabled:opacity-50 hover:bg-gray-50 transition-all"
          >
            Poprzednia
          </button>
          <span className="text-gray-700 font-medium">
            Strona {currentPage} z {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-6 py-3 rounded-xl bg-white border border-gray-300 shadow-sm disabled:opacity-50 hover:bg-gray-50 transition-all"
          >
            Następna
          </button>
        </div>
      )}

      {/* MODAL USUNIĘCIA */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <Trash2 className="w-8 h-8 text-red-600" />
              Potwierdź usunięcie
            </h3>
            <p className="text-gray-600 mb-8">
              Czy na pewno chcesz trwale usunąć ten pomiar?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-6 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 transition-all flex items-center gap-2"
              >
                <X className="w-5 h-5" /> Anuluj
              </button>
              <button
                onClick={confirmDelete}
                className="px-6 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-all flex items-center gap-2"
              >
                <Trash2 className="w-5 h-5" /> Usuń
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
