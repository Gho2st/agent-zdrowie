export default function Audience() {
  const items = [
    {
      emoji: "👵",
      label: "Seniorzy",
      desc: "Łatwy w obsłudze interfejs, przypomnienia o pomiarach i wysoki poziom bezpieczeństwa.",
    },
    {
      emoji: "👨‍⚕️",
      label: "Pacjenci przewlekli",
      desc: "Cukrzyca, nadciśnienie, cholesterol – Agent wspiera monitorowanie.",
    },
    {
      emoji: "👩‍💻",
      label: "Osoby zapracowane",
      desc: "Błyskawiczne odpowiedzi bez przeszukiwania internetu — AI zna Twój kontekst.",
    },
    {
      emoji: "👨‍👩‍👧",
      label: "Rodziny",
      desc: "Zadbaj o zdrowie bliskich - możesz analizować ich pomiary razem.",
    },
  ];

  return (
    <section className="mt-20 pt-10 rounded-4xl">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 xl:mb-16">
        👥 Dla kogo jest Agent Zdrowie?
      </h2>
      <div className="grid md:grid-cols-2 gap-8  mx-auto">
        {items.map((item) => (
          <div
            key={item.label}
            className="bg-white/30 border border-gray-200 p-6 rounded-2xl"
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
