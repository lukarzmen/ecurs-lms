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
            <h2 className="text-lg font-semibold text-gray-900">2. Konto użytkownika</h2>
            <p>
              Rejestracja wymaga podania prawdziwych danych. Użytkownik jest odpowiedzialny za bezpieczeństwo swoich danych
              logowania oraz za działania wykonane w ramach konta.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">3. Kursy i treści</h2>
            <p>
              Treści kursów są dostarczane przez nauczycieli. Platforma pełni rolę techniczną i nie odpowiada za
              merytoryczną zawartość kursów.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">4. Płatności</h2>
            <p>
              Płatności obsługiwane są przez Stripe. W przypadku płatnych kursów umowa sprzedaży zawierana jest bezpośrednio
              między uczniem a nauczycielem. Szczegóły płatności znajdują się w interfejsie zakupu.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">5. Dane osobowe</h2>
            <p>
              Zasady przetwarzania danych osobowych opisuje Polityka Prywatności. Korzystanie z platformy oznacza zapoznanie
              się z nią i akceptację.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">6. Zmiany regulaminu</h2>
            <p>
              Administrator może aktualizować regulamin. Zmiany będą komunikowane w serwisie lub mailowo.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">7. Kontakt</h2>
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
