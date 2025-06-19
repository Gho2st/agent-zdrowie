import Image from "next/image";

export default function About() {
  return (
    <section>
      <h1 className="text-4xl leading-snug font-bold">
        Agent Zdrowie – Twój cyfrowy asystent zdrowia
      </h1>
      <p className="my-16 text-xl w-3/4">
        Nowoczesna aplikacja zdrowotna, która nie tylko zapisuje pomiary – ona
        je rozumie. Dzięki sztucznej inteligencji analizuje Twoje dane i wspiera
        Cię w dbaniu o zdrowie każdego dnia.
      </p>
      <div className="flex gap-16 flex-col md:flex-row">
        <div className="grid md:grid-cols-2 gap-6 w-full md:w-1/2">
          {[
            {
              emoji: "🤖",
              title: "Indywidualna analiza",
              text: "Agent Zdrowie dostosowuje normy i oceny do Twojego wieku, płci, wagi i historii zdrowia. Każdy użytkownik ma unikalny profil – tak jak w prawdziwej opiece zdrowotnej.",
            },
            {
              emoji: "📏",
              title: "Automatyczne normy",
              text: "Normy nie są sztywne – są przeliczane na podstawie Twoich danych i aktualnych wytycznych. Zmieniłeś wagę? System sam przeliczy zakresy bez pytania.",
            },
            {
              emoji: "⚠️",
              title: "Inteligentne alerty",
              text: "Agent wykrywa przekroczenia norm i od razu Cię informuje. Nie musisz znać wartości na pamięć – wystarczy spojrzeć, a system powie, czy jest OK.",
            },
            {
              emoji: "💬",
              title: "Proaktywne podpowiedzi",
              text: "„Wysokie ciśnienie – stresujący dzień?” albo „Waga rośnie – wróć do aktywności” – nasza AI nie ocenia, tylko wspiera i sugeruje działania.",
            },
          ].map((item, i) => (
            <div
              key={item.title} // 🔑 Dodajemy key tutaj
              className="bg-white/60 backdrop-blur-sm border border-white/40 p-6 rounded-2xl shadow-md hover:shadow-lg transition"
            >
              <h2 className="text-2xl font-semibold mb-2">
                {item.emoji} {item.title}
              </h2>
              <p className="text-gray-700">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="w-1/3 ml-24">
          <Image
            className=""
            src={"/agent2.png"}
            width={700}
            height={700}
            layout="responsive"
            alt="agent ai"
            priority
          />
        </div>
      </div>
    </section>
  );
}
