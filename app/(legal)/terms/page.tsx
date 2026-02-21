import Link from "next/link";

const TermsPage = () => {
  const effectiveDate = "01.02.2026";

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto w-full max-w-4xl rounded-2xl border bg-white p-6 shadow-sm sm:p-10">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-semibold text-gray-900">Regulamin (Terms of Service)</h1>
          <p className="text-sm text-gray-500">Obowiązuje od: {effectiveDate}</p>
          <p className="text-gray-600">
            Regulamin określa zasady korzystania z platformy Ecurs oraz prawa i obowiązki użytkowników.
          </p>
        </div>

        <div className="space-y-6 text-sm text-gray-700">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">1. Informacje ogólne</h2>
            <p>
              Platforma Ecurs umożliwia tworzenie i udział w kursach online. Korzystając z serwisu, użytkownik akceptuje
              niniejszy regulamin.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">2. Definicje (Szkoła i indywidualny nauczyciel)</h2>
            <p>
              Na potrzeby niniejszego regulaminu poniższe pojęcia mają następujące znaczenie:
            </p>
            <ul className="list-disc pl-6">
              <li>
                <b>Platforma</b> – serwis internetowy Ecurs.
              </li>
              <li>
                <b>Użytkownik</b> – osoba posiadająca konto na Platformie.
              </li>
              <li>
                <b>Uczeń</b> – Użytkownik korzystający z kursów jako odbiorca treści edukacyjnych.
              </li>
              <li>
                <b>Nauczyciel</b> – Użytkownik publikujący kursy lub współtworzący kursy na Platformie.
              </li>
              <li>
                <b>Szkoła</b> – podmiot (np. instytucja, organizacja, firma lub osoba prowadząca działalność), dla którego w
                ramach Platformy prowadzone jest konto/obszar organizacyjny umożliwiający zarządzanie kursami oraz
                nauczycielami (zespołem). Szkoła może posiadać jedno lub wiele kont nauczycieli.
              </li>
              <li>
                <b>Indywidualny nauczyciel (Tryb indywidualny)</b> – Nauczyciel działający samodzielnie, wybierający w procesie
                rejestracji opcję „indywidualny nauczyciel”. Dla jasności: w takim modelu na potrzeby rozliczeń i postanowień
                regulaminu Indywidualny nauczyciel jest traktowany jako Szkoła posiadająca jedno konto nauczyciela na
                Platformie.
              </li>
              <li>
                <b>Tryb Organizacji</b> – sposób korzystania z Platformy właściwy dla Szkoły w sytuacji, gdy (i) Szkoła posiada
                więcej niż jedno konto nauczyciela lub (ii) liczba aktywnych uczniów przypisanych do Szkoły przekracza 50.
                Tryb Organizacji odpowiada rozszerzonemu wariantowi rozliczeń oraz opcji „nowa szkoła”
                dostępnej podczas rejestracji.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">3. Konto użytkownika</h2>
            <p>
              Rejestracja wymaga podania prawdziwych danych. Użytkownik jest odpowiedzialny za bezpieczeństwo swoich danych
              logowania oraz za działania wykonane w ramach konta.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">4. Kursy i treści</h2>
            <p>
              Treści kursów są dostarczane przez nauczycieli. Platforma pełni rolę techniczną i nie odpowiada za
              merytoryczną zawartość kursów.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">5. Płatności</h2>
            <p>
              Płatności obsługiwane są przez Stripe. W przypadku płatnych kursów umowa sprzedaży zawierana jest bezpośrednio
              między uczniem a szkołą. Szczegóły płatności znajdują się w interfejsie zakupu.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">6. Dane osobowe</h2>
            <p>
              Zasady przetwarzania danych osobowych opisuje Polityka Prywatności. Korzystanie z platformy oznacza zapoznanie
              się z nią i akceptację.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">7. Zmiany regulaminu</h2>
            <p>
              Administrator może aktualizować regulamin. Zmiany będą komunikowane w serwisie lub mailowo.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">8. Kontakt</h2>
            <p>
              W sprawach związanych z regulaminem prosimy o kontakt: <a href="mailto:kontakt@ecurs.pl" className="underline">kontakt@ecurs.pl</a>.
            </p>
          </section>
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            Powrót na stronę główną
          </Link>
          <Link href="/privacy" className="text-sm font-medium text-gray-600 hover:text-gray-800">
            Przejdź do Polityki Prywatności
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
