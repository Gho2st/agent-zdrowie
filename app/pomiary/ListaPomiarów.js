"use client";

export default function ListaPomiarow({
  measurements,
  filterType,
  setFilterType,
  requestDelete,
  confirmDeleteId,
  setConfirmDeleteId,
  confirmDelete,
}) {
  const filteredMeasurements = measurements.filter((m) =>
    filterType === "all" ? true : m.type === filterType
  );

  return (
    <>
      <div className="mt-10 mx-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Filtruj pomiary
        </h2>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="w-full p-3 border shadow-2xl bg-white/30 border-gray-300 rounded-lg"
        >
          <option value="all">Wszystkie</option>
          <option value="ciśnienie">Ciśnienie</option>
          <option value="cukier">Cukier</option>
          <option value="waga">Waga</option>
          <option value="tętno">Tętno</option>
        </select>
      </div>

      <div className="mt-6 mx-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Twoje pomiary</h2>
        {filteredMeasurements.length === 0 ? (
          <p className="text-gray-500 text-center">
            Brak pomiarów do wyświetlenia
          </p>
        ) : (
          <ul className="space-y-3 grid md:grid-cols-3 gap-4">
            {filteredMeasurements.map((m) => (
              <li
                key={m.id}
                className="p-4 bg-white/30 rounded-lg shadow-md text-gray-700 relative"
              >
                <strong className="capitalize">{m.type}</strong>:{" "}
                {m.type === "ciśnienie" && m.systolic && m.diastolic
                  ? `${m.systolic}/${m.diastolic} ${m.unit}`
                  : `${m.amount} ${m.unit}`}{" "}
                – {new Date(m.createdAt).toLocaleString("pl-PL")}
                {m.type === "cukier" && (
                  <p className="text-sm text-gray-500">
                    {m.timing ? `(${m.timing})` : ""}{" "}
                    {m.context && `– ${m.context}`}
                  </p>
                )}
                {m.type === "ciśnienie" && m.note && (
                  <p className="text-sm text-gray-500">Notatka: {m.note}</p>
                )}
                <button
                  onClick={() => requestDelete(String(m.id))}
                  className="absolute top-2 right-2 text-red-600 hover:text-red-800 text-sm"
                >
                  ✖
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="p-6 bg-white rounded-lg shadow-xl w-11/12 max-w-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Czy na pewno chcesz usunąć pomiar?
            </h3>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Anuluj
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Usuń
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
