export default function Safety() {
  return (
    <section className="mt-32">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">
        🔒 Dlaczego to bezpieczne?
      </h2>

      <p className="text-lg md:text-xl text-center text-gray-700 max-w-3xl mx-auto mb-10">
        Rozumiemy, że zdrowie to temat wrażliwy. Dlatego Agent Zdrowie został
        zaprojektowany tak, aby minimalizować zbieranie danych i jasno
        informować, jak są one przetwarzane.
      </p>

      <div className="grid md:grid-cols-2 gap-6 2xl:gap-8  mx-auto">
        <div className="bg-white/30  backdrop-blur-sm border border-white/40 p-6 rounded-2xl shadow-xl">
          <h3 className="text-xl font-semibold mb-2">
            🛡️ Logowanie przez Google
          </h3>
          <p className="text-gray-700">
            Korzystamy z bezpiecznego logowania Google — nie przechowujemy
            Twojego hasła. Konto identyfikujemy wyłącznie po adresie e-mail.
          </p>
        </div>

        <div className="bg-white/30  backdrop-blur-sm border border-white/40 p-6 rounded-2xl shadow-xl">
          <h3 className="text-xl font-semibold mb-2">📁 Prywatność danych</h3>
          <p className="text-gray-700">
            Twoje dane zdrowotne zapisujemy w bazie Neon (PostgreSQL w chmurze).
            Nie sprzedajemy ich ani nie wykorzystujemy w celach marketingowych.
          </p>
        </div>

        <div className="bg-white/30  backdrop-blur-sm border border-white/40 p-6 rounded-2xl shadow-xl">
          <h3 className="text-xl font-semibold mb-2">
            🧠 Sprawdzona technologia AI
          </h3>
          <p className="text-gray-700">
            Odpowiedzi generuje API OpenAI (GPT-4 / GPT-4o). Model świetnie
            rozpoznaje wzorce i udziela spersonalizowanych wskazówek, ale nie
            zastępuje konsultacji lekarskiej.
          </p>
        </div>

        <div className="bg-white/30  backdrop-blur-sm border border-white/40 p-6 rounded-2xl shadow-xl">
          <h3 className="text-xl font-semibold mb-2">
            ⚖️ Pełna przejrzystość i kontrola
          </h3>
          <p className="text-gray-700">
            Twoje dane należą do Ciebie — w każdej chwili możesz je przejrzeć,
            pobrać lub poprosić o ich usunięcie.
          </p>
        </div>
      </div>
    </section>
  );
}
