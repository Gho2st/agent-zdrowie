export default function Safety() {
  return (
    <section className="mt-32">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">
        🔒 Dlaczego to bezpieczne?
      </h2>

      <p className="text-lg md:text-xl text-center text-gray-700 max-w-3xl mx-auto mb-10">
        Zdajemy sobie sprawę, że zdrowie to sprawa wrażliwa. Dlatego Agent
        Zdrowie został zaprojektowany z myślą o Twoim bezpieczeństwie i
        prywatności – zarówno technicznie, jak i etycznie.
      </p>

      <div className="grid md:grid-cols-2 gap-6 2xl:gap-8  mx-auto">
        <div className="bg-white/30  backdrop-blur-sm border border-white/40 p-6 rounded-2xl shadow-xl">
          <h3 className="text-xl font-semibold mb-2">
            🛡️ Logowanie przez Google
          </h3>
          <p className="text-gray-700">
            Korzystamy z bezpiecznego logowania Google – Twoje hasło nie jest
            nigdzie przechowywane. Każde konto użytkownika jest w pełni
            chronione i powiązane z unikalnym adresem e-mail.
          </p>
        </div>

        <div className="bg-white/30  backdrop-blur-sm border border-white/40 p-6 rounded-2xl shadow-xl">
          <h3 className="text-xl font-semibold mb-2">📁 Prywatność danych</h3>
          <p className="text-gray-700">
            Twoje dane zdrowotne są przechowywane lokalnie w naszej bazie danych
            – nigdy nie są udostępniane osobom trzecim ani wykorzystywane do
            celów marketingowych.
          </p>
        </div>

        <div className="bg-white/30  backdrop-blur-sm border border-white/40 p-6 rounded-2xl shadow-xl">
          <h3 className="text-xl font-semibold mb-2">
            🧠 Sprawdzona technologia AI
          </h3>
          <p className="text-gray-700">
            Badania wykazują, że modele językowe, takie jak GPT-4, potrafią
            trafnie identyfikować objawy, rozpoznawać wzorce zdrowotne i
            wspierać decyzje medyczne – zawsze jednak służą jako wsparcie, a nie
            zamiennik lekarza.
          </p>
        </div>

        <div className="bg-white/30  backdrop-blur-sm border border-white/40 p-6 rounded-2xl shadow-xl">
          <h3 className="text-xl font-semibold mb-2">
            ⚖️ Transparentność i kontrola
          </h3>
          <p className="text-gray-700">
            Masz pełną kontrolę nad swoimi danymi – w każdej chwili możesz
            zażądać ich usunięcia. Agent działa zgodnie z RODO i dobrymi
            praktykami etycznymi.
          </p>
        </div>
      </div>
    </section>
  );
}
