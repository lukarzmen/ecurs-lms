import Link from "next/link";

const PrivacyPage = () => {
  const effectiveDate = "01.02.2026";

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto w-full max-w-4xl rounded-2xl border bg-white p-6 shadow-sm sm:p-10">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-semibold text-gray-900">Polityka Prywatności (Privacy Policy)</h1>
          <p className="text-sm text-gray-500">Obowiązuje od: {effectiveDate}</p>
          <p className="text-gray-600">
            Dokument opisuje, jak przetwarzamy dane osobowe oraz jakie prawa przysługują użytkownikom zgodnie z RODO.
          </p>
        </div>

        <div className="space-y-6 text-sm text-gray-700">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">1. Administrator danych</h2>
            <p>
              Administratorem danych jest Łukasz Mędyk Oprogramowanie. Kontakt: <a href="mailto:kontakt@ecurs.pl" className="underline">kontakt@ecurs.pl</a>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">2. Zakres danych</h2>
            <p>
              Przetwarzamy dane podane podczas rejestracji i korzystania z platformy (np. imię, nazwisko, e-mail, identyfikatory
              konta, dane płatnicze przekazywane do Stripe).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">3. Cele i podstawy prawne</h2>
            <ul className="list-disc pl-5">
              <li>Realizacja umowy i świadczenie usług – art. 6 ust. 1 lit. b RODO.</li>
              <li>Obsługa płatności i rozliczeń – art. 6 ust. 1 lit. b i c RODO.</li>
              <li>Kontakt i wsparcie – art. 6 ust. 1 lit. b RODO.</li>
              <li>Bezpieczeństwo i zapobieganie nadużyciom – art. 6 ust. 1 lit. f RODO.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">4. Odbiorcy danych</h2>
            <p>
              Dane mogą być przekazywane podmiotom wspierającym obsługę platformy, w szczególności Stripe jako operatorowi płatności.
              Stripe przetwarza dane zgodnie z własną polityką prywatności: <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">stripe.com/privacy</a>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">5. Okres przechowywania</h2>
            <p>
              Dane przechowujemy przez czas niezbędny do realizacji umowy i obowiązków prawnych, a następnie przez okres
              wymagany przepisami prawa.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">6. Prawa użytkownika</h2>
            <p>
              Użytkownik ma prawo dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia,
              sprzeciwu oraz wniesienia skargi do organu nadzorczego.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">7. Pliki cookies</h2>
            <p>
              Serwis używa plików cookies w celu prawidłowego działania, analizy ruchu i personalizacji treści. Użytkownik
              może zarządzać cookies w ustawieniach przeglądarki.
            </p>
          </section>
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            Powrót na stronę główną
          </Link>
          <Link href="/terms" className="text-sm font-medium text-gray-600 hover:text-gray-800">
            Przejdź do Regulaminu
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
