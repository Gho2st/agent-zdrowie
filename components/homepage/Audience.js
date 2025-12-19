export default function Audience() {
  const items = [
    {
      emoji: "👵",
      label: "Seniorzy",
      desc: "Łatwy w obsłudze interfejs, duże przyciski, przypomnienia o pomiarach i wysoki poziom bezpieczeństwa danych.",
      color: "bg-blue-50 text-blue-600",
    },
    {
      emoji: "👨‍⚕️",
      label: "Pacjenci przewlekli",
      desc: "Cukrzyca, nadciśnienie? Agent wspiera stałe monitorowanie, analizuje trendy i wykrywa anomalie.",
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      emoji: "👩‍💻",
      label: "Osoby zapracowane",
      desc: "Błyskawiczne odpowiedzi bez przeszukiwania setek stron w internecie. AI zna Twój kontekst i oszczędza czas.",
      color: "bg-amber-50 text-amber-600",
    },
    {
      emoji: "👨‍👩‍👧",
      label: "Rodziny",
      desc: "Zadbaj o zdrowie bliskich. Możesz prowadzić profile rodziców lub dzieci i analizować ich wyniki w jednym miejscu.",
      color: "bg-rose-50 text-rose-600",
    },
  ];

  return (
    <section className="mt-24 py-16 px-4 relative overflow-hidden">
      {/* Dekoracyjne tło */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50/50 via-white to-white -z-10 pointer-events-none" />

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <span className="text-emerald-600 font-bold tracking-wider uppercase text-xs bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            Grupy docelowe
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight mt-6">
            Dla kogo jest{" "}
            <span className="text-emerald-600">Agent Zdrowie?</span>
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            Niezależnie od wieku i stanu zdrowia, pomagamy Ci podejmować lepsze
            decyzje każdego dnia.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {items.map((item) => (
            <div
              key={item.label}
              className="group relative bg-white border border-gray-100 p-8 rounded-3xl shadow-lg shadow-gray-200/40 hover:shadow-xl hover:shadow-emerald-100/50 hover:border-emerald-200 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              {/* Dekoracyjne duże emoji w tle */}
              <div className="absolute -right-4 -top-4 text-9xl opacity-[0.03] group-hover:opacity-[0.07] group-hover:scale-110 transition-all duration-500 select-none grayscale group-hover:grayscale-0">
                {item.emoji}
              </div>

              <div className="relative z-10 flex flex-col sm:flex-row gap-6 items-start">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 ${item.color} group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm`}
                >
                  {item.emoji}
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                    {item.label}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
