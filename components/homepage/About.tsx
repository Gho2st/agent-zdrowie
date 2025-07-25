import Image from "next/image";

export default function About() {
  return (
    <section className="">
      <h1 className="text-3xl md:text-4xl lg:text-5xl leading-snug font-bold text-center">
        Agent Zdrowie – Twój cyfrowy asystent zdrowia
      </h1>

      <p className="my-10 text-lg md:text-xl text-center max-w-3xl mx-auto">
        Nowoczesna aplikacja zdrowotna, która nie tylko zapisuje pomiary – ona
        je rozumie. Dzięki sztucznej inteligencji analizuje Twoje dane i wspiera
        Cię w dbaniu o zdrowie każdego dnia.
      </p>

      <div className="flex flex-col-reverse lg:flex-row items-center gap-10 mt-16">
        {/* Text Cards */}
        <div className="grid sm:grid-cols-2 gap-6 flex-1 w-full">
          {[
            {
              emoji: "🤖",
              title: "Spersonalizowana analiza",
              text: "Dzięki integracji z Twoim profilem zdrowotnym, Agent interpretuje wyniki pomiarów w kontekście wieku, płci, historii chorób i leków.",
            },
            {
              emoji: "📊",
              title: "Połączenie z bazą danych",
              text: "Wszystkie pomiary są zapisywane i analizowane – aplikacja pamięta Twoje ostatnie wartości i wykrywa zmiany na przestrzeni czasu.",
            },
            {
              emoji: "🚨",
              title: "Inteligentne ostrzeżenia",
              text: "Przekroczyłeś normę ciśnienia? Glukoza za wysoka? Agent nie tylko Ci to powie, ale też wyjaśni dlaczego to ważne.",
            },
            {
              emoji: "💡",
              title: "Rozmowy z AI",
              text: "Zadaj pytanie, opisz objawy lub poproś o interpretację wyników – Agent odpowie, jak empatyczny doradca zdrowia.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-white/30 backdrop-blur-sm border border-white/40 p-6 rounded-2xl shadow-2xl hover:shadow-lg transition"
            >
              <h2 className="text-xl font-semibold mb-2">
                {item.emoji} {item.title}
              </h2>
              <p className="text-gray-700">{item.text}</p>
            </div>
          ))}
        </div>

        {/* Image */}
        <div className="w-full max-w-sm md:max-w-md 2xl:max-w-lg">
          <Image
            src="/agent.png"
            alt="agent ai"
            width={700}
            height={700}
            layout="responsive"
            priority
          />
        </div>
      </div>
    </section>
  );
}
