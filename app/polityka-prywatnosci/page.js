import Container from "@/components/UI/Container/Container";

export default function PolitykaPrywatnosci() {
  return (
    <Container>
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Polityka prywatności aplikacji „Agent Zdrowie”
        </h1>

        <p className="text-sm text-gray-500 mb-8">
          Ostatnia aktualizacja: 5 stycznia 2026 r.
        </p>

        <div className="prose prose-lg text-gray-700 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              1. Administrator danych osobowych
            </h2>
            <p>
              Administratorem Twoich danych osobowych jest Dominik Jojczyk,
              autor aplikacji „Agent Zdrowie”, działający w ramach pracy
              inżynierskiej na Uniwersytecie Komisji Edukacji Narodowej w
              Krakowie.
            </p>
            <p className="mt-2">
              Kontakt z administratorem:{" "}
              <a
                href="mailto:dominik.jojczyk@gmail.com"
                className="text-emerald-600 underline"
              >
                dominik.jojczyk@gmail.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              2. Jakie dane przetwarzamy?
            </h2>
            <p>Przetwarzamy następujące kategorie danych:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                Dane identyfikacyjne i kontaktowe: adres e-mail, imię (pobierane
                z konta Google).
              </li>
              <li>
                <strong>
                  Dane dotyczące zdrowia (kategoria specjalna – art. 9 RODO)
                </strong>
                : data urodzenia, płeć biologiczna, wzrost, waga, poziom
                aktywności fizycznej, informacje o chorobach współistniejących
                (cukrzyca, stan przedcukrzycowy, nadciśnienie, choroby serca,
                choroby nerek), pomiary parametrów zdrowotnych (ciśnienie krwi,
                glukoza, tętno, masa ciała), codzienne samopoczucie (nastrój,
                sen, stres, energia).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              3. Cel i podstawa prawna przetwarzania
            </h2>
            <p>Dane przetwarzamy wyłącznie w celu:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                Personalizacji norm zdrowotnych i generowania spersonalizowanych
                porad zdrowotnych w aplikacji.
              </li>
              <li>
                Wizualizacji trendów zdrowotnych i generowania raportów PDF dla
                lekarza.
              </li>
            </ul>
            <p className="mt-4">
              <strong>Podstawa prawna:</strong>
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                Dane zwykłe (e-mail, imię) – Twoja zgoda (art. 6 ust. 1 lit. a
                RODO).
              </li>
              <li>
                <strong>Dane dotyczące zdrowia</strong> – Twoja wyraźna zgoda
                (art. 9 ust. 2 lit. a RODO), wyrażona poprzez zaznaczenie
                dedykowanego pola checkbox podczas uzupełniania profilu
                zdrowotnego.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              4. Odbiorcy danych
            </h2>
            <p>
              Dane nie są przekazywane żadnym podmiotom trzecim, z wyjątkiem:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                OpenAI LLC – wyłącznie w zakresie niezbędnym do generowania
                porad przez model GPT-4o (kontekst zawiera Twoje dane zdrowotne,
                ale są one anonimizowane tam, gdzie to możliwe; OpenAI działa
                jako podmiot przetwarzający na podstawie umowy powierzenia
                przetwarzania danych).
              </li>
              <li>Google LLC – w zakresie uwierzytelniania (Google OAuth).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              5. Okres przechowywania danych
            </h2>
            <p>
              Dane przechowywane są przez cały okres korzystania z aplikacji. Po
              usunięciu konta lub wycofaniu zgody wszystkie dane zdrowotne są
              trwale usuwane w ciągu 30 dni.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              6. Twoje prawa
            </h2>
            <p>Przysługują Ci następujące prawa:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Prawo dostępu do danych i otrzymania ich kopii.</li>
              <li>Prawo do sprostowania danych.</li>
              <li>Prawo do usunięcia danych („prawo do bycia zapomnianym”).</li>
              <li>Prawo do ograniczenia przetwarzania.</li>
              <li>
                Prawo do wycofania zgody w dowolnym momencie (bez wpływu na
                zgodność przetwarzania przed wycofaniem) - poprzez przycisk w
                ustawieniach profilu.
              </li>
              <li>
                Prawo wniesienia skargi do Prezesa Urzędu Ochrony Danych
                Osobowych.
              </li>
            </ul>
            <p className="mt-4">
              Aby skorzystać z praw, napisz na adres:
              <a
                href="mailto:dominik.jojczyk@gmail.com"
                className="text-emerald-600 underline"
              >
                dominik.jojczyk@gmail.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              7. Zabezpieczenia
            </h2>
            <p>Stosujemy odpowiednie środki techniczne i organizacyjne:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Uwierzytelnianie wyłącznie przez Google OAuth.</li>
              <li>
                Szyfrowanie danych w tranzycie (HTTPS) i spoczynku (Neon
                PostgreSQL).
              </li>
              <li>
                Dostęp do danych tylko po stronie serwera (Next.js Server
                Actions).
              </li>
              <li>Minimalizacja danych – zbieramy tylko to, co niezbędne.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              8. Postanowienia końcowe
            </h2>
            <p>
              Aplikacja „Agent Zdrowie” nie służy do stawiania diagnoz
              medycznych. Generowane porady mają charakter wyłącznie edukacyjny
              i profilaktyczny. Zawsze konsultuj wyniki z lekarzem.
            </p>
            <p className="mt-4">
              Zastrzegamy prawo do zmiany niniejszej polityki prywatności.
              Aktualna wersja zawsze dostępna jest pod adresem
              /polityka-prywatnosci.
            </p>
          </section>
        </div>
      </div>
    </Container>
  );
}
