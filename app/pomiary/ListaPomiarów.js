"use client";

import React, { useState, useMemo } from "react";
import {
  Heart,
  Droplets,
  Scale,
  Activity,
  Trash2,
  ChevronUp,
  ChevronDown,
  Filter,
  ArrowUpDown,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Info,
  AlertTriangle,
} from "lucide-react";

import { analyzeMeasurement } from "../utils/healthAnalysis";

const ITEMS_PER_PAGE = 12;

const MEASUREMENT_STYLES = {
  BLOOD_PRESSURE: {
    label: "Ciśnienie",
    icon: Activity,
    bg: "bg-indigo-50",
    text: "text-indigo-600",
  },
  GLUCOSE: {
    label: "Glukoza",
    icon: Droplets,
    bg: "bg-amber-50",
    text: "text-amber-600",
  },
  WEIGHT: {
    label: "Waga",
    icon: Scale,
    bg: "bg-teal-50",
    text: "text-teal-600",
  },
  HEART_RATE: {
    label: "Tętno",
    icon: Heart,
    bg: "bg-rose-50",
    text: "text-rose-600",
  },
  DEFAULT: {
    label: "Inne",
    icon: Activity,
    bg: "bg-gray-50",
    text: "text-gray-600",
  },
};

const STATUS_LABELS = {
  CRITICAL: "Krytyczny",
  ALARM: "Powyżej normy",
  ELEVATED: "Podwyższony",
  HIGH: "Za wysoki",
  LOW: "Za niski",
  OPTIMAL: "Optymalny",
  IN_RANGE: "W normie",
  OK: "OK",
  UNKNOWN: "Brak norm",
  IN_TARGET: "W strefie",
  BELOW_TARGET: "Poniżej strefy",
  ABOVE_TARGET: "Powyżej strefy",
  THERAPY_TARGET_EXCEEDED: "Powyżej celu terapeutycznego",
};

const COLOR_STYLES = {
  red: "text-red-600 bg-red-50 border-red-100",
  orange: "text-orange-600 bg-orange-50 border-orange-100",
  yellow: "text-amber-700 bg-amber-50 border-amber-200",
  green: "text-emerald-600 bg-emerald-50 border-emerald-100",
  blue: "text-blue-600 bg-blue-50 border-blue-100",
  gray: "text-gray-500 bg-gray-50 border-gray-100",
};

const getStatusIcon = (color) => {
  switch (color) {
    case "green":
      return <CheckCircle2 className="w-3.5 h-3.5" />;
    case "red":
    case "orange":
      return <AlertTriangle className="w-3.5 h-3.5" />;
    case "blue":
    case "yellow":
      return <AlertCircle className="w-3.5 h-3.5" />;
    default:
      return null;
  }
};

const getMeasurementDisplay = (m) => {
  switch (m.type) {
    case "BLOOD_PRESSURE":
      return `${m.systolic || m.value}/${m.diastolic || m.value2}`;
    case "GLUCOSE":
    case "WEIGHT":
    case "HEART_RATE":
      return `${m.amount || m.value}`;
    default:
      return "—";
  }
};

const VALID_CONTEXTS = ["przed posiłkiem", "po posiłku", "podczas treningu"];

const getValidContext = (raw) => {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return VALID_CONTEXTS.includes(trimmed) ? trimmed : null;
};

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

      const getVal = (item) => item.amount || item.value || item.systolic || 0;
      return sortOrder === "valueDesc"
        ? getVal(b) - getVal(a)
        : getVal(a) - getVal(b);
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
      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 border ${
        sortOrder === value
          ? "bg-white border-blue-300 text-blue-700"
          : "bg-gray-50 border-gray-200 text-gray-600"
      }`}
    >
      {label}
      {sortOrder === value &&
        (value.includes("Desc") ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronUp className="w-3 h-3" />
        ))}
    </button>
  );

  return (
    <div className="mt-10">
      <div className="bg-white border border-gray-200 rounded-3xl p-6 mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              Filtrowanie
            </h2>
            <div className="relative">
              <select
                value={filterType}
                onChange={handleFilterChange}
                className="appearance-none w-full md:w-64 pl-4 pr-10 py-2.5 rounded-xl bg-gray-50 border border-gray-300 text-gray-700 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 transition-all"
              >
                <option value="all">Wszystkie typy</option>
                <option value="BLOOD_PRESSURE">💓 Ciśnienie</option>
                <option value="GLUCOSE">🍭 Cukier</option>
                <option value="WEIGHT">⚖️ Waga</option>
                <option value="HEART_RATE">❤️ Tętno</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <ArrowUpDown className="w-5 h-5 text-gray-400" />
              Sortowanie
            </h2>
            <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-xl">
              <SortButton value="dateDesc" label="Najnowsze" />
              <SortButton value="dateAsc" label="Najstarsze" />
              <SortButton value="valueDesc" label="Wartość max" />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-6 px-2">
          Historia pomiarów{" "}
          <span className="text-gray-400 font-normal text-base ml-1">
            ({processed.totalItems})
          </span>
        </h2>

        {processed.paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white border border-gray-200 rounded-3xl text-center">
            <div className="bg-gray-100 p-4 rounded-full mb-4">
              <Filter className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">
              Brak wyników dla wybranych filtrów.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {processed.paginated.map((m) => {
              const style =
                MEASUREMENT_STYLES[m.type] || MEASUREMENT_STYLES.DEFAULT;
              const Icon = style.icon;

              const valueForAnalysis =
                m.type === "BLOOD_PRESSURE"
                  ? { sys: m.systolic || m.value, dia: m.diastolic || m.value2 }
                  : m.amount || m.value;

              const validContext = getValidContext(m.context);

              let analysisContext = {};

              if (m.type === "GLUCOSE") {
                if (
                  validContext === "przed posiłkiem" ||
                  validContext === "po posiłku"
                ) {
                  analysisContext.timing = validContext;
                }
              } else if (m.type === "HEART_RATE") {
                if (validContext === "podczas treningu") {
                  analysisContext.context = "podczas treningu";
                } else {
                  analysisContext.context = "spoczynkowe"; // domyślny
                }
              }

              const analysis = analyzeMeasurement(
                m.type,
                valueForAnalysis,
                norms,
                analysisContext,
                norms?.hasHighRisk ?? false,
              );

              let normHint = "";
              if (norms) {
                if (m.type === "BLOOD_PRESSURE" && norms.systolicMax) {
                  normHint = `Limit: < ${norms.systolicMax}/${norms.diastolicMax}`;
                } else if (m.type === "GLUCOSE") {
                  if (
                    analysisContext.timing === "przed posiłkiem" &&
                    norms.glucoseFastingMax
                  ) {
                    normHint = `Norma na czczo: < ${norms.glucoseFastingMax}`;
                  } else if (
                    analysisContext.timing === "po posiłku" &&
                    norms.glucosePostMealMax
                  ) {
                    normHint = `Norma po posiłku: < ${norms.glucosePostMealMax}`;
                  }
                } else if (m.type === "WEIGHT" && norms.weightMax) {
                  normHint = `Norma: ${norms.weightMin}-${norms.weightMax}`;
                } else if (m.type === "HEART_RATE") {
                  if (analysisContext.context === "podczas treningu") {
                    normHint = `Strefa: ${norms.targetHeartRateMin}–${norms.targetHeartRateMax} bpm`;
                  } else {
                    normHint = `Norma spoczynkowa: ${norms.pulseMin}-${norms.pulseMax}`;
                  }
                }
              }

              const statusLabel =
                STATUS_LABELS[analysis.status] || analysis.status;
              const colorClass =
                COLOR_STYLES[analysis.color] || COLOR_STYLES.gray;

              return (
                <div
                  key={m.id}
                  className="bg-white border border-gray-200 p-5 rounded-2xl flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2.5 rounded-xl ${style.bg} ${style.text}`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-gray-700 leading-tight">
                            {style.label}
                          </h3>
                          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mt-0.5">
                            {m.unit}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => requestDelete(String(m.id))}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Usuń wpis"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mb-4">
                      <span className="text-2xl font-black text-gray-800">
                        {getMeasurementDisplay(m)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${colorClass}`}
                      title={analysis.message}
                    >
                      {getStatusIcon(analysis.color)}
                      {statusLabel}
                    </div>

                    {(analysis.isOutOfNorm ||
                      analysis.status === "ELEVATED" ||
                      analysis.status?.includes("TARGET")) && (
                      <div className="flex flex-col gap-0.5">
                        {/* {analysis.message && (
                          <p className="text-[10px] leading-tight text-gray-500">
                            {analysis.message}
                          </p>
                        )} */}
                        {normHint && (
                          <p className="text-[10px] font-medium text-gray-400">
                            ({normHint})
                          </p>
                        )}
                      </div>
                    )}

                    <div className="pt-3 border-t border-gray-200 flex flex-col gap-1.5 text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {new Date(m.createdAt).toLocaleString("pl-PL", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>

                      {validContext && (
                        <div className="text-gray-600 font-medium bg-gray-50 px-1.5 py-0.5 rounded w-fit">
                          {validContext}
                        </div>
                      )}

                      {m.note && (
                        <div className="text-gray-500 italic flex items-start gap-1">
                          <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span className="truncate" title={m.note}>
                            {m.note}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-10">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-xl bg-gray-100 border border-gray-300 text-sm font-medium disabled:opacity-50 hover:bg-gray-200 transition-colors"
          >
            Poprzednia
          </button>

          <div className="px-4 py-2 bg-gray-800 rounded-xl text-sm font-bold text-white shadow-md">
            {currentPage} / {totalPages}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-xl bg-gray-100 border border-gray-300 text-sm font-medium disabled:opacity-50 hover:bg-gray-200 transition-colors"
          >
            Następna
          </button>
        </div>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 max-w-sm w-full border border-gray-200 scale-100 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4 text-red-500 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-gray-800 text-center mb-2">
              Usunąć pomiar?
            </h3>
            <p className="text-center text-gray-500 mb-8 text-sm">
              Tej operacji nie można cofnąć. Pomiar zniknie z historii i
              statystyk.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium shadow-lg shadow-red-200 transition-all"
              >
                Usuń
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
