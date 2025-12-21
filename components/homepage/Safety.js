import {
  ShieldCheck,
  Database,
  BrainCircuit,
  FileKey2,
  Lock,
} from "lucide-react";

export default function Safety() {
  const features = [
    {
      icon: ShieldCheck,
      title: "Logowanie przez Google",
      desc: "Korzystamy z bezpiecznego standardu OAuth. Nie przechowujemy Twojego hasła. Konto identyfikujemy wyłącznie po unikalnym tokenie i adresie e-mail.",
    },
    {
      icon: Database,
      title: "Prywatność danych",
      desc: "Twoje dane zdrowotne zapisujemy w szyfrowanej bazie Neon (PostgreSQL). Nie sprzedajemy ich ani nie udostępniamy podmiotom trzecim w celach marketingowych.",
    },
    {
      icon: BrainCircuit,
      title: "Sprawdzona technologia AI",
      desc: "Odpowiedzi generuje API OpenAI (GPT-4o). Model nie trenuje się na Twoich danych w czasie rzeczywistym. Pamiętaj, że AI wspiera, ale nie zastępuje lekarza.",
    },
    {
      icon: FileKey2,
      title: "Pełna kontrola",
      desc: "Twoje dane należą do Ciebie. W każdej chwili możesz pobrać pełną historię swoich pomiarów lub trwale usunąć konto jednym kliknięciem.",
    },
  ];

  return (
    <section className="mt-24 py-16 px-4 relative">
      <div className="absolute inset-0 -z-10 h-full w-full bg-white [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#ecfdf5_100%)]"></div>

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider">
            <Lock className="w-3 h-3" />
            Bezpieczeństwo i Zaufanie
          </div>

          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            Twoje zdrowie,{" "}
            <span className="text-emerald-600 relative">
              Twoja tajemnica
              <svg
                className="absolute w-full h-2 bottom-0 left-0 text-emerald-200 -z-10"
                viewBox="0 0 100 10"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 5 Q 50 10 100 5"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                />
              </svg>
            </span>
          </h2>

          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Rozumiemy, że zdrowie to temat wrażliwy. Agent Zdrowie został
            zaprojektowany zgodnie z zasadą <em>Privacy by Design</em> —
            zbieramy tylko to, co niezbędne.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {features.map((item, index) => (
            <div
              key={index}
              className="group bg-white border border-gray-100 p-8 rounded-3xl shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-emerald-100/50 hover:border-emerald-200 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex flex-col sm:flex-row gap-5 items-start">
                <div className="shrink-0 p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                  <item.icon className="w-8 h-8" strokeWidth={1.5} />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                    {item.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
