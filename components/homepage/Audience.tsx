export default function Audience() {
  const items = [
    {
      emoji: "👵",
      label: "Seniorzy",
      desc: "Prosty interfejs, przypomnienia o pomiarach, bezpieczeństwo.",
    },
    {
      emoji: "👨‍⚕️",
      label: "Pacjenci przewlekli",
      desc: "Cukrzyca, nadciśnienie, cholesterol – Agent wspiera monitorowanie.",
    },
    {
      emoji: "👩‍💻",
      label: "Osoby zapracowane",
      desc: "Szybkie odpowiedzi, bez szukania w Google. AI Cię zna.",
    },
    {
      emoji: "👨‍👩‍👧",
      label: "Rodziny",
      desc: "Zadbaj o zdrowie bliskich – możesz analizować ich pomiary razem.",
    },
  ];

  return (
    <section className="mt-20 py-20 bg-white/30 rounded-4xl">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
        👥 Dla kogo jest Agent Zdrowie?
      </h2>
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto px-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="bg-gray-50 border border-gray-200 p-6 rounded-2xl"
          >
            <h3 className="text-xl font-semibold mb-2">
              {item.emoji} {item.label}
            </h3>
            <p className="text-gray-700">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
