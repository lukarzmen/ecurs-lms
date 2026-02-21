"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

const TERMS_EFFECTIVE_DATE = "18.10.2025";
const TERMS_LAST_UPDATE = "18.10.2025";

const TERMS_VERSION = "2025-10-18";

const plDateToIsoDateOnly = (plDate: string) => {
  const [day, month, year] = plDate.split(".");
  if (!day || !month || !year) return null;
  return `${year}-${month}-${day}`;
};

const TERMS_EFFECTIVE_DATE_ISO = plDateToIsoDateOnly(TERMS_EFFECTIVE_DATE) ?? TERMS_VERSION;
const TERMS_LAST_UPDATE_ISO = plDateToIsoDateOnly(TERMS_LAST_UPDATE) ?? TERMS_VERSION;

const STUDENT_TERMS = (
  <div className="text-left max-h-40 sm:max-h-48 md:max-h-64 overflow-y-auto px-2 sm:px-3 py-2 sm:py-3 bg-orange-50 rounded-lg border border-orange-200 shadow-inner text-xs sm:text-sm leading-relaxed space-y-1 sm:space-y-2">
    <h2 className="text-sm sm:text-lg font-bold text-orange-700 mb-1 sm:mb-2">📜 Warunki uczestnictwa użytkownika w platformie Ecurs</h2>
    <p className="text-xs text-gray-500 mb-1 sm:mb-2">
      Obowiązuje od: {TERMS_EFFECTIVE_DATE} &nbsp;|&nbsp; Ostatnia aktualizacja: {TERMS_LAST_UPDATE}
    </p>
    <p className="font-semibold text-gray-700">§1. Postanowienia ogólne</p>
    <ul className="list-disc ml-6 text-gray-700">
      <li>Niniejszy regulamin określa zasady korzystania z platformy Ecurs, w tym prawa i obowiązki użytkowników.</li>
      <li>Korzystanie z platformy oznacza akceptację niniejszego regulaminu (browsewrap). Jednak do rejestracji i zakupu kursu wymagane jest wyraźne kliknięcie „Akceptuję” (clickwrap).</li>
      <li>
        Platforma działa zgodnie z przepisami prawa Unii Europejskiej oraz Rzeczypospolitej Polskiej, w szczególności:
        <ul className="list-disc ml-6">
          <li><b>RODO</b> (Rozporządzenie Parlamentu Europejskiego i Rady (UE) 2016/679)</li>
          <li><b>Ustawa o świadczeniu usług drogą elektroniczną</b> (Dz.U. z 2020 r. poz. 344)</li>
          <li><b>Prawo autorskie</b> (Dz.U. z 2022 r. poz. 2509)</li>
        </ul>
      </li>
    </ul>
    <p className="font-semibold text-gray-700 mt-2">§2. Rejestracja i konto użytkownika</p>
    <ul className="list-disc ml-6 text-gray-700">
      <li>Rejestracja na platformie wymaga podania prawdziwych danych osobowych oraz akceptacji regulaminu.</li>
      <li>Użytkownik zobowiązuje się do ochrony swoich danych logowania i nieudostępniania ich osobom trzecim.</li>
      <li>Administrator platformy ma prawo do zawieszenia lub usunięcia konta użytkownika w przypadku naruszenia regulaminu.</li>
    </ul>
    <p className="font-semibold text-gray-700 mt-2">§3. Ochrona danych osobowych</p>
    <ul className="list-disc ml-6 text-gray-700">
      <li>Dane osobowe użytkowników są przetwarzane zgodnie z RODO.</li>
      <li>Użytkownik ma prawo do wglądu, poprawiania oraz usunięcia swoich danych.</li>
      <li>Administrator zobowiązuje się do stosowania odpowiednich środków technicznych i organizacyjnych w celu ochrony danych.</li>
    </ul>
    <p className="font-semibold text-gray-700 mt-2">§4. Korzystanie z platformy</p>
    <ul className="list-disc ml-6 text-gray-700">
      <li>Użytkownik zobowiązuje się do korzystania z platformy zgodnie z jej przeznaczeniem oraz obowiązującym prawem.</li>
      <li>Zabronione jest publikowanie treści niezgodnych z prawem, naruszających prawa autorskie lub dobre obyczaje.</li>
      <li>Administrator ma prawo do moderowania treści oraz usuwania materiałów naruszających regulamin.</li>
    </ul>
    <p className="font-semibold text-gray-700 mt-2">§5. Warunki płatności</p>
    <ul className="list-disc ml-6 text-gray-700">
      <li>Uczestnictwo w płatnych kursach wymaga zakupu dostępu do wybranego kursu według ceny podanej w marketplace.</li>
      <li>Płatność za kurs może być jednorazowa lub w formie subskrypcji, w zależności od opcji wybranej przez szkołę.</li>
      <li><b>Anulowanie subskrypcji:</b> W przypadku subskrypcji, uczeń może anulować subskrypcję w dowolnym momencie przez panel ustawień. Anulowanie jest skuteczne na koniec bieżącego okresu rozliczeniowego - do tego czasu uczeń zachowuje dostęp do zakupionych materiałów.</li>
      <li>Zwroty i reklamacje są rozpatrywane indywidualnie zgodnie z polityką platformy.</li>
      <li><b>Umowa sprzedaży kursu zawierana jest bezpośrednio między uczniem a szkołą.</b> Platforma Ecurs pełni wyłącznie rolę pośrednika technicznego umożliwiającego zawarcie umowy.</li>
      <li><b>Płatności za kursy trafiają bezpośrednio na konto szkoły.</b> Platforma nie jest stroną umowy sprzedaży i nie ponosi odpowiedzialności za jej wykonanie.</li>
      <li><b>Obsługa płatności:</b> Wszystkie płatności są obsługiwane przez bezpieczny system Stripe Connect. Z każdej transakcji pobierana jest prowizja zgodnie z <a href="https://stripe.com/en-pl/pricing" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">cennikiem Stripe</a>, która jest automatycznie potrącana przed przekazaniem środków szkole.</li>
      <li><b>Faktury VAT:</b> Uczniowie mogą opcjonalnie zaznaczyć podczas zakupu kursu, że wymagają faktury VAT. Faktura zostanie automatycznie wygenerowana przez system Stripe z danych szkoły zgodnie z obowiązującymi przepisami podatkowymi. Dla odbiorców w Polsce VAT ID będzie wyświetlony w formacie &quot;PL&quot; + NIP.</li>
    </ul>
    <p className="font-semibold text-gray-700 mt-2">§6. Odpowiedzialność za treści kursów</p>
    <ul className="list-disc ml-6 text-gray-700">
      <li><b>Wyłączna odpowiedzialność nauczyciela:</b> Za merytoryczną treść kursów, ich jakość, poprawność oraz zgodność z prawem odpowiada wyłącznie nauczyciel prowadzący kurs.</li>
      <li><b>Brak odpowiedzialności platformy:</b> Platforma Ecurs nie weryfikuje treści merytorycznej kursów i nie ponosi odpowiedzialności za ich zawartość, błędy, szkody wynikające z korzystania z kursów lub niezgodność z oczekiwaniami ucznia.</li>
      <li><b>Roszczenia uczniów:</b> Wszelkie roszczenia dotyczące treści kursów, ich jakości, zwrotów, odszkodowań lub innych roszczeń związanych z kursami uczniowie kierują bezpośrednio do szkoły. Platforma nie jest stroną tych sporów.</li>
      <li><b>Moderacja:</b> Platforma zastrzega sobie prawo do usuwania treści naruszających prawo lub regulamin, ale nie ma obowiązku ich weryfikacji.</li>
    </ul>
    <p className="font-semibold text-gray-700 mt-2">§7. Ograniczenie odpowiedzialności platformy</p>
    <ul className="list-disc ml-6 text-gray-700">
      <li><b>Wyłączenie odpowiedzialności:</b> W maksymalnym zakresie dozwolonym przez prawo, platforma Ecurs wyłącza swoją odpowiedzialność za wszelkie szkody powstałe w związku z korzystaniem z platformy, w tym szkody wynikające z niedostępności serwisu, utraty danych, błędów technicznych.</li>
      <li><b>Odpowiedzialność użytkownika:</b> Użytkownik korzysta z platformy na własne ryzyko i ponosi pełną odpowiedzialność za swoje działania na platformie.</li>
      <li><b>Siła wyższa:</b> Platforma nie ponosi odpowiedzialności za szkody wynikające z działania siły wyższej, awarii systemów płatniczych, problemów z dostawcami usług internetowych lub innych czynników pozostających poza kontrolą platformy.</li>
      <li><b>Maksymalna odpowiedzialność:</b> W przypadkach, gdy wyłączenie odpowiedzialności nie jest możliwe, odpowiedzialność platformy ograniczona jest do wysokości opłaty uiszczonej przez użytkownika za konkretny kurs w ostatnich 12 miesiącach.</li>
    </ul>
    <p className="font-semibold text-gray-700 mt-2">§8. Prawo własności intelektualnej</p>
    <ul className="list-disc ml-6 text-gray-700">
      <li><b>Prawa autorskie do kursów:</b> Wszystkie prawa autorskie do treści kursów należą wyłącznie do nauczycieli je tworzących.</li>
      <li><b>Licencja dla platformy:</b> Nauczyciel udziela platformie niewyłącznej licencji na prezentację treści wyłącznie w celu świadczenia usług platformy.</li>
      <li><b>Naruszenia praw autorskich:</b> Za wszelkie naruszenia praw autorskich w treściach kursów odpowiada wyłącznie nauczyciel. Użytkownik zobowiązuje się zwolnić platformę z wszelkich roszczeń związanych z naruszeniem praw autorskich.</li>
    </ul>
    <p className="font-semibold text-gray-700 mt-2">§9. Pliki cookies</p>
    <ul className="list-disc ml-6 text-gray-700">
      <li>
        Serwis wykorzystuje pliki cookies w celu zapewnienia prawidłowego działania, personalizacji treści oraz analizy ruchu. Korzystając z serwisu, użytkownik wyraża zgodę na używanie plików cookies zgodnie z Polityką Prywatności. Użytkownik może zmienić ustawienia dotyczące cookies w swojej przeglądarce internetowej.
      </li>
    </ul>
    <p className="font-semibold text-gray-700 mt-2">§10. Postanowienia końcowe</p>
    <ul className="list-disc ml-6 text-gray-700">
      <li>Administrator zastrzega sobie prawo do zmiany regulaminu, informując o tym użytkowników.</li>
      <li>Wszelkie spory wynikające z korzystania z platformy będą rozstrzygane zgodnie z prawem polskim.</li>
      <li>Administrator zastrzega sobie prawo do usunięcia danych użytkownika po 360 dniach nieaktywności.</li>
      <li><b>Zwolnienie z odpowiedzialności:</b> Użytkownik zobowiązuje się do zwolnienia platformy Ecurs, jej właścicieli, pracowników i współpracowników z wszelkich roszczeń, szkód, kosztów prawnych wynikających z naruszenia niniejszego regulaminu lub działań użytkownika na platformie.</li>
      <li><b>Integralność umowy:</b> Niniejszy regulamin stanowi całość umowy między użytkownikiem a platformą i zastępuje wszelkie wcześniejsze ustalenia.</li>
      <li><b>Rozdzielność postanowień:</b> W przypadku uznania któregokolwiek z postanowień niniejszego regulaminu za nieważne, pozostałe postanowienia zachowują pełną moc prawną.</li>
    </ul>
    <p className="mt-4 text-xs text-gray-500">
      Akceptacja regulaminu poprzez kliknięcie „Akceptuję” jest wymagana do rejestracji i zakupu kursów.<br />
      O wszelkich zmianach w regulaminie użytkownicy zostaną poinformowani mailowo lub poprzez komunikat w serwisie. Dalsze korzystanie z platformy po zmianie regulaminu oznacza jego akceptację.
    </p>
  </div>
);

const TEACHER_TERMS = (
  <div className="text-left max-h-40 sm:max-h-48 md:max-h-64 overflow-y-auto px-2 sm:px-3 py-2 sm:py-3 bg-blue-50 rounded-lg border border-blue-200 shadow-inner text-xs sm:text-sm leading-relaxed space-y-1 sm:space-y-2">
    <h2 className="text-sm sm:text-lg font-bold text-blue-700 mb-1 sm:mb-2">📜 Warunki uczestnictwa nauczyciela w platformie Ecurs</h2>
    <p className="text-xs text-gray-500 mb-1 sm:mb-2">
      Obowiązuje od: {TERMS_EFFECTIVE_DATE} &nbsp;|&nbsp; Ostatnia aktualizacja: {TERMS_LAST_UPDATE}
    </p>
    <p className="font-semibold text-gray-700">§1. Postanowienia ogólne</p>
    <ul className="list-disc ml-6 text-gray-700">
      <li>Niniejszy regulamin określa zasady korzystania z platformy Ecurs przez nauczycieli, w tym prawa i obowiązki nauczycieli.</li>
      <li>Korzystanie z platformy jako nauczyciel oznacza akceptację niniejszego regulaminu (browsewrap). Jednak do rejestracji i korzystania z funkcji nauczycielskich wymagane jest wyraźne kliknięcie „Akceptuję” (clickwrap).</li>
      <li>
        Platforma działa zgodnie z przepisami prawa Unii Europejskiej oraz Rzeczypospolitej Polskiej, w szczególności:
        <ul className="list-disc ml-6">
          <li><b>RODO</b> (Rozporządzenie Parlamentu Europejskiego i Rady (UE) 2016/679)</li>
          <li><b>Ustawa o świadczeniu usług drogą elektroniczną</b> (Dz.U. z 2020 r. poz. 344)</li>
          <li><b>Prawo autorskie</b> (Dz.U. z 2022 r. poz. 2509)</li>
        </ul>
      </li>
    </ul>
    <p className="font-semibold text-gray-700 mt-2">§2. Rejestracja i konto nauczyciela</p>
    <ul className="list-disc ml-6 text-gray-700">
      <li>Rejestracja jako nauczyciel wymaga podania prawdziwych danych osobowych oraz akceptacji regulaminu i warunków płatności.</li>
      <li>Nauczyciel zobowiązuje się do ochrony swoich danych logowania i nieudostępniania ich osobom trzecim.</li>
      <li>Administrator platformy ma prawo do zawieszenia lub usunięcia konta nauczyciela w przypadku naruszenia regulaminu.</li>
    </ul>
    <p className="font-semibold text-gray-700 mt-2">§3. Ochrona danych osobowych</p>
    <ul className="list-disc ml-6 text-gray-700">
      <li>Dane osobowe nauczycieli są przetwarzane zgodnie z RODO.</li>
      <li>Nauczyciel ma prawo do wglądu, poprawiania oraz usunięcia swoich danych.</li>
      <li>Administrator zobowiązuje się do stosowania odpowiednich środków technicznych i organizacyjnych w celu ochrony danych.</li>
    </ul>
    <p className="font-semibold text-gray-700 mt-2">§4. Korzystanie z platformy przez nauczyciela</p>
    <ul className="list-disc ml-6 text-gray-700">
      <li>Nauczyciel zobowiązuje się do korzystania z platformy zgodnie z jej przeznaczeniem oraz obowiązującym prawem.</li>
      <li>Zabronione jest publikowanie treści niezgodnych z prawem, naruszających prawa autorskie lub dobre obyczaje.</li>
      <li>Nauczyciel ponosi odpowiedzialność za treści publikowane w ramach prowadzonych kursów.</li>
      <li>Administrator ma prawo do moderowania treści oraz usuwania materiałów naruszających regulamin.</li>
    </ul>
    <p className="font-semibold text-gray-700 mt-2">§5. Rejestracja w systemie płatności Stripe</p>
    <ul className="list-disc ml-6 text-gray-700">
      <li>
        <b>Obowiązkowa rejestracja konta płatności:</b> Każdy nauczyciel musi zarejestrować się w systemie płatności Stripe w celu otrzymywania płatności od uczniów. Jest to wymagane prawnie do przetwarzania transakcji.
      </li>
      <li>
        <b>Proces rejestracji:</b> W dalszych krokach rejestracji poprosimy Cię o konfigurację konta płatności w Stripe, gdzie podasz swoje dane do celów płatności i fiskalnych.
      </li>
      <li>
        <b>Dane wymagane przez Stripe:</b> Imię i nazwisko, adres, numer telefonu, dane bankowe do otrzymywania płatności oraz NIP (który w Stripe będzie używany jako VAT ID w formacie &quot;PL&quot; + NIP dla celów fakturowania VAT).
      </li>
      <li>
        <b>Weryfikacja dokumentu tożsamości (Stripe Identity):</b> Korzystamy ze Stripe w celu weryfikacji dokumentu tożsamości. Stripe zbiera obrazy dokumentów tożsamości, obrazy twarzy, numery dokumentów i adresy, a także zaawansowane sygnały antyfraudowe oraz informacje o urządzeniach łączących się z jego usługami. Stripe udostępnia nam te informacje oraz wykorzystuje je do świadczenia i ulepszania swoich usług, w tym do wykrywania oszustw. Możesz również zdecydować, że zezwalasz Stripe na wykorzystanie Twoich danych w celu ulepszania technologii biometrycznej weryfikacji Stripe. Więcej informacji o Stripe oraz jego polityce prywatności znajdziesz na <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">https://stripe.com/privacy</a>.
      </li>
      <li>
        <b>Obowiązki fiskalne:</b> Nauczyciel jest odpowiedzialny za rozliczenie podatkowe otrzymanych płatności zgodnie z obowiązującym prawem na podstawie dokumentów dostarczanych przez Stripe, w tym faktur VAT. Platforma Ecurs nie jest stroną transakcji i nie ponosi odpowiedzialności za rozliczenia podatkowe.
      </li>
      <li>
        <b>Bezpieczeństwo danych:</b> Wszystkie dane płatności są przetwarzane przez certyfikowany system Stripe zgodnie z najwyższymi standardami bezpieczeństwa (PCI DSS Level 1). Platforma Ecurs nie przechowuje wrażliwych danych płatności.
      </li>
    </ul>
    <p className="font-semibold text-gray-700 mt-2">§5A. Obsługa płatności przez Stripe Connect i prowizje</p>
    <ul className="list-disc ml-6 text-gray-700">
      <li>
        <b>Technologia Stripe Connect:</b> Platforma wykorzystuje system Stripe Connect do obsługi płatności, który umożliwia bezpieczne i automatyczne przekazywanie płatności bezpośrednio na konto szkoły po dokonaniu zakupu przez ucznia.
      </li>
      <li>
        <b>Prowizje Stripe:</b> Ze każdej transakcji płatniczej Stripe pobiera prowizję zgodnie z aktualnym cennikiem dostępnym na <a href="https://stripe.com/en-pl/pricing" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">stripe.com/en-pl/pricing</a>. Prowizja ta jest automatycznie potrącana z kwoty płatności przed jej przekazaniem na konto szkoły.
      </li>
      <li>
        <b>Brak dodatkowych opłat platformy:</b> Platforma Ecurs nie pobiera dodatkowych prowizji ani opłat od transakcji płatniczych - jedyne koszty to prowizje Stripe oraz opłata za licencję platformy zgodnie z wybranym planem.
      </li>
      <li>
        <b>Automatyczne rozliczenia:</b> Wszystkie płatności są automatycznie rozliczane przez system Stripe, a nauczyciel otrzymuje szczegółowe raporty transakcji w swoim panelu Stripe oraz na platformie Ecurs.
      </li>
      <li>
        <b>Rozliczenia podatkowe:</b> Stripe obsługuje wszystkie rozliczenia podatkowe związane z transakcjami i dostarcza szkole odpowiednie dokumenty podatkowe, w tym faktury VAT jeśli zostały skonfigurowane. Platforma Ecurs nie jest stroną transakcji i nie ponosi odpowiedzialności za rozliczenia podatkowe.
      </li>
      <li>
        <b>Waluty i kursy wymiany:</b> System obsługuje płatności w różnych walutach zgodnie z możliwościami Stripe, a konwersje walutowe są realizowane według aktualnych kursów Stripe.
      </li>
      <li>
        <b>Zwroty i refundacje:</b> Proces zwrotów środków jest obsługiwany przez system Stripe zgodnie z jego regulaminem i może podlegać dodatkowym opłatom zgodnie z cennikiem Stripe.
      </li>
      <li>
        <b>Automatyczne faktury VAT:</b> System Stripe Connect umożliwia automatyczne generowanie faktur VAT dla transakcji. NIP szkoły jest automatycznie konwertowany na VAT ID w formacie &quot;PL&quot; + NIP dla celów rozliczeń w Polsce. Szkoły mogą skonfigurować w swoim panelu Stripe automatyczne wystawianie faktur VAT zgodnie z polskimi i europejskimi przepisami podatkowymi. Uczniowie mogą opcjonalnie zaznaczyć podczas zakupu, że wymagają faktury VAT.
      </li>
      <li>
        <b>Obsługa VAT w UE:</b> Stripe automatycznie obsługuje procedury VAT dla sprzedaży cyfrowej w krajach Unii Europejskiej, w tym system OSS (One-Stop Shop), co umożliwia nauczycielom compliance z przepisami podatkowymi różnych krajów UE.
      </li>
    </ul>
    <p className="font-semibold text-gray-700 mt-2">§6. Warunki płatności, okresy rozliczeniowe i zmiana licencji</p>
    <ul className="list-disc ml-6 text-gray-700">
      <li>
        <b>Indywidualny twórca</b> – osoba fizyczna prowadząca kursy na platformie Ecurs, posiadająca nie więcej niż 50 aktywnych uczniów oraz jedno konto nauczyciela.
      </li>
      <li>
        <b>Tryb Organizacji</b> – (szkoła / placówka edukacyjna) instytucja lub organizacja, która posiada więcej niż jednego nauczyciela (współtworzących kursy) lub więcej niż 50 aktywnych uczniów. Szkoła może tworzyć zespoły nauczycieli i zarządzać kursami wspólnie.
      </li>
      <li>
        Po zakończeniu okresu próbnego (3 miesiące) nauczyciel lub szkoła zobowiązani są do wyboru jednego z planów płatności:
        <ul className="list-disc ml-6 mt-2">
          <li>
            <b>Plan dla indywidualnych twórców prowadzących do 50 uczniów w zamkniętych kursach:</b> 39 zł za miesiąc – pełny dostęp do funkcji, tworzenie interaktywnych kursów, zarządzanie treściami i uczniami, podstawowe wsparcie techniczne.
          </li>
          <li>
            <b>Tryb Organizacji (szkoły i placówki edukacyjne) lub twórcy posiadający więcej niż 50 uczniów w zamkniętych kursach:</b> 1499 zł za rok – pełny dostęp do wszystkich funkcjonalności, nielimitowani członkowie zespołu, pełne wsparcie techniczne.
          </li>
          <li>
            <b>Dołączenie do istniejącej szkoły:</b> Nauczyciel, który dołączy do istniejącej szkoły jako członek zespołu, nie płaci za korzystanie z platformy. Subskrypcję platformy opłaca właściciel szkoły, a nauczyciel dołączony do szkoły automatycznie otrzymuje pełny dostęp do wszystkich funkcjonalności platformy.
          </li>
        </ul>
      </li>
      <li>
        <b>Mechanizm przejścia:</b> Jeśli liczba aktywnych uczniów w kursach zamkniętych przekroczy 50 osób lub do kursów zostanie przypisany drugi nauczyciel, użytkownik zostanie automatycznie poinformowany o konieczności przejścia na Tryb Organizacji. Informacja zostanie przekazana mailowo na adres podany przy rejestracji oraz poprzez komunikat w panelu platformy. Użytkownik ma 30 dni na przejście na wyższy plan.
      </li>
      <li>
        <b>Zasady naliczania opłat:</b> W przypadku zmiany planu w trakcie trwania okresu rozliczeniowego, opłata za nową licencję zostanie naliczona proporcjonalnie do pozostałego okresu rozliczeniowego.
      </li>
      <li>
        <b>Prawo do anulowania subskrypcji:</b> Nauczyciel ma prawo do anulowania subskrypcji w dowolnym momencie przez panel ustawień. Anulowanie jest skuteczne na koniec bieżącego okresu rozliczeniowego - do tego czasu nauczyciel zachowuje dostęp do wszystkich funkcji platformy. Nie pobieramy dodatkowych kosztów za anulowanie.
      </li>
      <li>
        <b>Powiadomienie użytkownika:</b> Wszystkie informacje dotyczące konieczności zmiany licencji, promocji lub zmian cen będą przekazywane mailowo na adres podany przy rejestracji oraz poprzez komunikat w panelu platformy.
      </li>
      <li>
        <b>Faktura oraz informacje związane z płatnością za usługę zostaną wysłane na adres e-mail podany podczas rejestracji (powiązany z SSO/OAuth).</b>
      </li>
      <li>
        <b>Cena promocyjna:</b> Cena podana w regulaminie może się różnić w przypadku trwających promocji. Szczegóły promocji oraz okres ich obowiązywania są widoczne w panelu użytkownika i w wiadomości e-mail.
      </li>
      <li>Brak opłaty po okresie próbnym skutkuje zablokowaniem dostępu do funkcji nauczycielskich, a po upływie 180 dni od braku aktywnego konta nauczyciela (przy braku płatności za licencję) – usunięciem danych użytkownika.</li>
      <li>Wszelkie materiały udostępniane przez nauczyciela w ramach kursów pozostają jego własnością intelektualną, jednak nauczyciel udziela platformie Ecurs niewyłącznej, nieodpłatnej licencji na ich prezentację w ramach platformy na czas trwania kursu.</li>
      <li>W przypadku pytań dotyczących płatności lub faktur, prosimy o kontakt z administratorem platformy.</li>
    </ul>
    <p className="font-semibold text-gray-700 mt-2">§7. Odpowiedzialność nauczyciela za treści kursów</p>
    <ul className="list-disc ml-6 text-gray-700">
      <li><b>Wyłączna odpowiedzialność za treści:</b> Nauczyciel ponosi pełną i wyłączną odpowiedzialność za wszystkie treści publikowane w ramach prowadzonych kursów, w tym za ich merytoryczną poprawność, jakość, zgodność z prawem i bezpieczeństwo.</li>
      <li><b>Umowa z uczniami:</b> Nauczyciel zawiera bezpośrednią umową z uczniami na świadczenie usług edukacyjnych. Platforma pełni wyłącznie rolę pośrednika technicznego.</li>
      <li><b>Roszczenia uczniów:</b> Nauczyciel zobowiązuje się do samodzielnego rozpatrywania wszystkich roszczeń uczniów dotyczących treści kursów, ich jakości, zwrotów oraz wszelkich szkód wynikających z korzystania z kursów.</li>
      <li><b>Zwolnienie platformy:</b> Nauczyciel zobowiązuje się zwolnić platformę Ecurs z wszelkich roszczeń, odpowiedzialności oraz kosztów prawnych związanych z treściami kursów i świadczonymi usługami edukacyjnymi.</li>
      <li><b>Ubezpieczenie:</b> Nauczyciel zobowiązuje się do posiadania odpowiedniego ubezpieczenia odpowiedzialności cywilnej związanej z prowadzoną działalnością edukacyjną.</li>
    </ul>
    <p className="font-semibold text-gray-700 mt-2">§7A. Prawa intelektualne i majątkowe nauczyciela dołączającego do szkoły</p>
    <ul className="list-disc ml-6 text-gray-700">
      <li><b>Dołączenie do szkoły:</b> Nauczyciel, który dołącza do istniejącej szkoły jako członek zespołu, akceptuje zasady dotyczące praw własności do kursów i ścieżek edukacyjnych utworzonych w kontekście szkoły.</li>
      <li><b>Własność majątkowa kursów:</b> Kursy i ścieżki edukacyjne tworzone przez nauczyciela będącego członkiem szkoły stanowią własność majątkową szkoły. Szkoła jest uprawniona do zbierania płatności za te kursy i ścieżki.</li>
      <li><b>Autorstwo intelektualne:</b> Nauczyciel pozostaje autorem intelektualnym (twórcą) treści kursów. Prawo autorskie do treści merytorycznych utworzonych przez nauczyciela przysługuje nauczycielowi.</li>
      <li><b>Licencja dla szkoły:</b> Nauczyciel udziela szkole niewyłącznej, nieodpłatnej licencji na publikowanie, dystrybucję i sprzedaż kursów oraz ścieżek edukacyjnych na platformie Ecurs. Licencja ta jest udzielana na okres trwania członkostwa nauczyciela w szkole i powiązanych umów.</li>
      <li><b>Wynagrodzenie nauczyciela:</b> Zasady wynagrodzania nauczyciela za utworzone kursy i uzyskane przychody ustalane są w umowie między nauczycielem a szkołą i nie są regulowane przez platformę Ecurs.</li>
      <li><b>Rozwiązanie sporów:</b> Wszelkie spory dotyczące praw intelektualnych i majątkowych między nauczycielem a szkołą rozstrzygane są bezpośrednio między stronami zgodnie z ich umową oraz obowiązującym prawem. Platforma Ecurs nie uczestniczy w rozwiązywaniu takich sporów.</li>
      <li><b>Rezygnacja z członkostwa:</b> W przypadku rezygnacji nauczyciela z członkostwa w szkole, prawa majątkowe do utworzonych przez nauczyciela kursów i ścieżek pozostają własnością szkoły. Nauczyciel zachowuje prawa autorskie do treści merytorycznych, jednak szkoła zachowuje prawo do dalszego oferowania kursów zgodnie z licencją udzieloną przez nauczyciela.</li>
    </ul>
    <p className="font-semibold text-gray-700 mt-2">§9. Ograniczenie odpowiedzialności platformy</p>
    <ul className="list-disc ml-6 text-gray-700">
      <li><b>Charakter usługi:</b> Platforma świadczy wyłącznie usługi techniczne umożliwiające publikację i sprzedaż kursów. Nie jest dostawcą treści edukacyjnych ani stroną umów zawieranych między nauczycielami a uczniami.</li>
      <li><b>Wyłączenie odpowiedzialności:</b> Platforma wyłącza swoją odpowiedzialność za jakość, poprawność, skuteczność kursów oraz wszelkie szkody wynikające z ich wykorzystania.</li>
      <li><b>Odpowiedzialność za płatności:</b> Platforma nie ponosi odpowiedzialności za nieprawidłowości w rozliczeniach podatkowych nauczycieli, opóźnienia płatności czy problemy z systemem Stripe.</li>
      <li><b>Siła wyższa:</b> Platforma nie ponosi odpowiedzialności za szkody wynikające z działania siły wyższej, awarii systemów, ataków hakerskich lub innych zdarzeń pozostających poza jej kontrolą.</li>
      <li><b>Maksymalna odpowiedzialność:</b> W przypadkach gdzie wyłączenie odpowiedzialności prawnie nie jest możliwe, odpowiedzialność platformy ograniczona jest do wysokości miesięcznej opłaty za licencję nauczyciela.</li>
    </ul>
    <p className="font-semibold text-gray-700 mt-2">§10. Zgodność z prawem i obowiązki fiskalne</p>
    <ul className="list-disc ml-6 text-gray-700">
      <li><b>Platforma nie jest stroną transakcji:</b> Platforma Ecurs nie jest stroną umowy sprzedaży między nauczycielem a uczniem i nie rozlicza sprzedaży klientów. Nauczyciel jest formalnie sprzedawcą usług edukacyjnych.</li>
      <li><b>Rozliczenia podatkowe przez Stripe:</b> Wszystkie rozliczenia podatkowe związane z transakcjami płatniczymi są obsługiwane przez system Stripe zgodnie z obowiązującymi przepisami podatkowymi. Stripe dostarcza szkole niezbędne dokumenty i raporty do rozliczeń podatkowych.</li>
      <li><b>Obowiązki podatkowe nauczyciela:</b> Nauczyciel ponosi pełną odpowiedzialność za prawidłowe rozliczenie podatkowe wszystkich otrzymanych płatności zgodnie z polskim prawem podatkowym na podstawie dokumentów dostarczanych przez Stripe.</li>
      <li><b>Brak odpowiedzialności podatkowej platformy:</b> Platforma Ecurs nie ponosi odpowiedzialności za rozliczenia podatkowe nauczycieli ani za błędy w rozliczeniach podatkowych. Wszelkie kwestie podatkowe nauczyciel rozlicza bezpośrednio ze Stripe lub odpowiednimi organami podatkowymi.</li>
      <li><b>Konfiguracja stawki VAT:</b> Nauczyciel jest zobowiązany do samodzielnego skonfigurowania odpowiedniej stawki VAT (0% lub 23%) dla każdego kursu i ścieżki edukacyjnej w formularzu ceny. Wybór stawki VAT powinien być zgodny z obowiązującymi przepisami podatkowymi dotyczącymi sprzedaży usług edukacyjnych. Domyślna stawka VAT wynosi 23%.</li>
      <li><b>Odpowiedzialność za prawidłową stawkę VAT:</b> Nauczyciel ponosi pełną odpowiedzialność za wybór prawidłowej stawki VAT zgodnie z charakterem świadczonych usług edukacyjnych i obowiązującymi przepisami prawa podatkowego. Platforma nie ponosi odpowiedzialności za nieprawidłowy wybór stawki VAT przez nauczyciela.</li>
      <li><b>Rozliczanie VAT:</b> Nauczyciel jest zobowiązany do samodzielnego rozliczenia VAT z właściwym urzędem skarbowym na podstawie dokumentów i raportów dostarczanych przez system Stripe. Platforma nie rozlicza VAT w imieniu nauczyciela i nie ponosi odpowiedzialności za rozliczenia VAT.</li>
      <li><b>Faktury VAT:</b> System Stripe automatycznie generuje faktury VAT zgodnie ze skonfigurowaną przez nauczyciela stawką VAT, gdy uczeń zaznaczy opcję wymagania faktury podczas zakupu. Nauczyciel jest odpowiedzialny za prawidłową konfigurację danych fiskalnych w systemie Stripe.</li>
      <li><b>Działalność gospodarcza:</b> Nauczyciel zobowiązuje się do prowadzenia działalności zgodnie z obowiązującymi przepisami prawa, w tym dotyczącymi działalności gospodarczej, jeśli jest wymagana.</li>
      <li><b>Licencje i uprawnienia:</b> Nauczyciel zapewnia, że posiada wszystkie niezbędne licencje, uprawnienia i kwalifikacje do prowadzenia działalności edukacyjnej w zakresie oferowanych kursów.</li>
      <li><b>Prawa autorskie:</b> Nauczyciel gwarantuje, że posiada wszystkie prawa do wykorzystywanych w kursach materiałów lub posiada odpowiednie licencje na ich użycie.</li>
      <li><b>Odpowiedzialność karna:</b> Nauczyciel ponosi wyłączną odpowiedzialność karną za wszelkie czyny zabronione związane z prowadzoną działalnością edukacyjną.</li>
    </ul>
    <p className="font-semibold text-gray-700 mt-2">§11. Pliki cookies</p>
    <ul className="list-disc ml-6 text-gray-700">
      <li>
        Serwis wykorzystuje pliki cookies w celu zapewnienia prawidłowego działania, personalizacji treści oraz analizy ruchu. Korzystając z serwisu, użytkownik wyraża zgodę na używanie plików cookies zgodnie z Polityką Prywatności. Użytkownik może zmienić ustawienia dotyczące cookies w swojej przeglądarce internetowej.
      </li>
    </ul>
    <p className="font-semibold text-gray-700 mt-2">§12. Postanowienia końcowe</p>
    <ul className="list-disc ml-6 text-gray-700">
      <li>Administrator zastrzega sobie prawo do zmiany regulaminu, informując o tym nauczycieli.</li>
      <li>Wszelkie spory wynikające z korzystania z platformy będą rozstrzygane zgodnie z prawem polskim.</li>
      <li><b>Kompleksowe zwolnienie z odpowiedzialności:</b> Nauczyciel zobowiązuje się do zwolnienia platformy Ecurs, jej właścicieli, pracowników, współpracowników i podmiotów powiązanych z wszelkich roszczeń, odpowiedzialności cywilnej, karnej, administracyjnej, skarbowej oraz kosztów prawnych wynikających z działalności nauczyciela na platformie.</li>
      <li><b>Odszkodowanie:</b> Nauczyciel zobowiązuje się do pokrycia wszelkich szkód, kosztów postępowania prawnego i honorariów prawnych, które mogą zostać poniesione przez platformę w związku z roszczeniami osób trzecich wynikającymi z działalności nauczyciela.</li>
      <li><b>Rozstrzyganie sporów:</b> Spory między nauczycielem a uczniami rozstrzygane są bez udziału platformy. Sądem właściwym dla sporów między nauczycielem a platformą jest sąd właściwy dla siedziby platformy.</li>
      <li><b>Integralność umowy:</b> Niniejszy regulamin stanowi całość umowy i zastępuje wszelkie wcześniejsze ustalenia.</li>
      <li><b>Rozdzielność postanowień:</b> W przypadku uznania któregokolwiek postanowienia za nieważne, pozostałe zachowują pełną moc prawną.</li>
    </ul>
    <p className="mt-4 text-xs text-gray-500">
      Akceptacja regulaminu i warunków płatności poprzez kliknięcie „Akceptuję” jest wymagana do rejestracji jako nauczyciel.<br />
      O wszelkich zmianach w regulaminie nauczyciele zostaną poinformowani mailowo lub poprzez komunikat w serwisie. Dalsze korzystanie z platformy po zmianie regulaminu oznacza jego akceptację.
    </p>
  </div>
);

type RegistrationStep = "role-selection" | "terms-consent" | "business-type-selection" | "school-choice" | "find-school" | "terms-acceptance" | "user-creation" | "stripe-setup" | "platform-subscription" | "completed";
type LoadingState = "idle" | "creating-user" | "creating-stripe-account" | "redirecting-to-stripe" | "updating-user" | "creating-platform-subscription" | "completing-registration" | "sending-join-request";

interface School {
  id: number;
  name: string;
  description: string | null;
  companyName: string;
  ownerId: number;
  _count: {
    members: number;
  };
}

interface BusinessTypeData {
  businessType: "individual" | "company" | "join-school";
  companyName?: string;
  schoolName?: string;
  taxId?: string;
  requiresVatInvoices?: boolean;
  acceptStripeTerms?: boolean;
  acceptDataProcessing?: boolean;
  joinSchoolMode?: "own-school" | "join-existing-school";
  selectedSchoolId?: number;
}

export default function RegisterPage() {
  const { isSignedIn, userId, sessionId } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [currentStep, setCurrentStep] = useState<RegistrationStep>("role-selection");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [selectedRole, setSelectedRole] = useState<null | "student" | "teacher">(null);
  const [businessData, setBusinessData] = useState<BusinessTypeData>({
    businessType: "individual",
    companyName: "",
    schoolName: "",
    taxId: "",
    requiresVatInvoices: false,
    joinSchoolMode: undefined,
    selectedSchoolId: undefined
  });
  
  // Debug log for businessData changes
  useEffect(() => {
    if (currentStep === "platform-subscription") {
      console.log('[PLATFORM-SUBSCRIPTION] Current businessData:', businessData);
      console.log('[PLATFORM-SUBSCRIPTION] businessType is:', businessData.businessType);
      console.log('[PLATFORM-SUBSCRIPTION] joinSchoolMode is:', businessData.joinSchoolMode);
    }
  }, [currentStep, businessData]);
  
  // State to track if we need to go to platform-subscription after setting businessData
  const [needsPlatformSubscription, setNeedsPlatformSubscription] = useState(false);
  const [pendingBusinessData, setPendingBusinessData] = useState<BusinessTypeData | null>(null);
  const [currentSchoolType, setCurrentSchoolType] = useState<"individual" | "business" | null>(null);

  // Keep latest values for useEffect-driven flows without expanding dependency arrays
  const businessDataRef = useRef<BusinessTypeData>(businessData);
  const currentSchoolTypeRef = useRef<"individual" | "business" | null>(currentSchoolType);

  useEffect(() => {
    businessDataRef.current = businessData;
  }, [businessData]);

  useEffect(() => {
    currentSchoolTypeRef.current = currentSchoolType;
  }, [currentSchoolType]);
  
  useEffect(() => {
    if (needsPlatformSubscription && pendingBusinessData) {
      console.log('[useEffect] Updating businessData and going to platform-subscription:', pendingBusinessData);
      console.log('[useEffect] needsPlatformSubscription:', needsPlatformSubscription);
      console.log('[useEffect] pendingBusinessData:', pendingBusinessData);
      setBusinessData(pendingBusinessData);
      setCurrentStep("platform-subscription");
      setNeedsPlatformSubscription(false);
      setPendingBusinessData(null);
    }
  }, [needsPlatformSubscription, pendingBusinessData]);

  // Fallback: ensure platform-subscription step has sensible defaults even if school data wasn't hydrated
  useEffect(() => {
    if (selectedRole !== "teacher" || currentStep !== "platform-subscription") return;

    let patchedData: BusinessTypeData | null = null;

    if (!businessData.joinSchoolMode) {
      patchedData = { ...(patchedData ?? businessData), joinSchoolMode: "own-school" };
    }

    if (!businessData.businessType) {
      const fallbackType = currentSchoolType === "business" ? "company" : "individual";
      patchedData = { ...(patchedData ?? businessData), businessType: fallbackType };
    }

    if (patchedData) {
      setBusinessData(patchedData);
    }

    if (!currentSchoolType) {
      const effectiveType = (patchedData?.businessType ?? businessData.businessType) === "company" ? "business" : "individual";
      setCurrentSchoolType(effectiveType);
    }
  }, [selectedRole, currentStep, businessData.joinSchoolMode, businessData.businessType, currentSchoolType, businessData]);
  
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [userCheckCompleted, setUserCheckCompleted] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [schoolSearchTerm, setSchoolSearchTerm] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);
  const [joinRequestStatus, setJoinRequestStatus] = useState<{ [schoolId: number]: "idle" | "pending" | "sent" } >({});
  const router = useRouter();

  // Check user registration status and restore appropriate step
  useEffect(() => {
    const checkUserStatus = async () => {
      if (!isSignedIn || !userId) {
        setUserCheckCompleted(true);
        return;
      }

      const urlParams = new URLSearchParams(window.location.search);
      const success = urlParams.get('success');
      const refresh = urlParams.get('refresh');
      
      try {
        // First, try to find existing user by email (handles provider changes)
        // This will update providerId if user exists with complete profile
        const updateProviderResponse = await fetch("/api/user/update-provider-id", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        // Status 200: User exists with complete profile - check Stripe and subscription
        if (updateProviderResponse.status === 200) {
          const updateData = await updateProviderResponse.json();
          console.log('[checkUserStatus] User found with complete profile, providerId updated:', updateData.user.id);
          
          const isTeacher = updateData.user.roleId === 1;
          const isStudent = updateData.user.roleId === 0;
          
          if (isStudent) {
            // Student is fully registered
            setSelectedRole("student");
            setCurrentStep("completed");
            toast.success("Jesteś już zarejestrowany jako uczeń!");
            setTimeout(() => router.push("/"), 2000);
          } else if (isTeacher) {
            setSelectedRole("teacher");
            
            // Always populate businessData with school information if teacher has a school
            const ownsSchool = !!updateData.ownedSchools?.[0];
            const membershipSchool = updateData.schoolMemberships?.[0];
            const isMemberOfOtherSchool = !!(membershipSchool && (!ownsSchool || membershipSchool.schoolId !== updateData.ownedSchools?.[0]?.id));
            const schoolForData = updateData.ownedSchools?.[0] || membershipSchool?.school;
            
            if (schoolForData) {
              const businessType = (schoolForData.schoolType === "business" ? "company" : "individual") as "individual" | "company";
              const joinMode = isMemberOfOtherSchool ? "join-existing-school" : "own-school";
              setBusinessData({
                businessType,
                companyName: schoolForData.companyName || "",
                schoolName: schoolForData.name || "",
                taxId: schoolForData.taxId || "",
                requiresVatInvoices: schoolForData.requiresVatInvoices || false,
                joinSchoolMode: joinMode,
                selectedSchoolId: schoolForData.id
              });
              setCurrentSchoolType(schoolForData.schoolType as "individual" | "business");
              console.log('[checkUserStatus] School data populated from update-provider-id response:', schoolForData, 'isMemberOfOtherSchool:', isMemberOfOtherSchool, 'ownsSchool:', ownsSchool);
            }
            
            // Check if returning from Stripe
            if (success === 'stripe') {
              console.log("Returning from Stripe with success=stripe");
              toast.success('Konto Stripe zostało skonfigurowane! Teraz wybierz plan subskrypcji platformy.');

              const effectiveSchoolType = currentSchoolTypeRef.current
                || (schoolForData?.schoolType as "individual" | "business" | undefined)
                || (businessDataRef.current.businessType === 'company' ? 'business' : 'individual');
              setCurrentSchoolType(effectiveSchoolType);

              setBusinessData(prev => {
                const prevBusinessType = prev.businessType || businessDataRef.current.businessType;
                const businessTypeFromSchool = effectiveSchoolType === 'business' ? 'company' : 'individual';
                return {
                  ...prev,
                  businessType: prevBusinessType === 'company' ? 'company' : businessTypeFromSchool,
                  joinSchoolMode: prev.joinSchoolMode || 'own-school',
                  companyName: prev.companyName || schoolForData?.companyName || "",
                  schoolName: prev.schoolName || schoolForData?.name || "",
                  taxId: prev.taxId || schoolForData?.taxId || "",
                  requiresVatInvoices: typeof prev.requiresVatInvoices === 'boolean' ? prev.requiresVatInvoices : (schoolForData?.requiresVatInvoices || false),
                  selectedSchoolId: prev.selectedSchoolId || schoolForData?.id,
                };
              });

              setCurrentStep("platform-subscription");
            } else if (success === 'subscription') {
              toast.success('Płatność za platformę została przetworzona! Rejestracja zakończona.');
              setCurrentStep("completed");
              setTimeout(() => router.push("/teacher/courses"), 2000);
            } else {
              // Check if teacher has completed registration
              const hasStripe = updateData.stripeOnboardingComplete;
              const hasSubscription = updateData.hasActiveSubscription;
              const isMember = isMemberOfOtherSchool;
              
              console.log('[checkUserStatus] Teacher status - hasStripe:', hasStripe, 'hasSubscription:', hasSubscription, 'isMemberOfOtherSchool:', isMember, 'ownsSchool:', ownsSchool);
              
              // If teacher is a member of a school (not owner), they don't need to pay - school owner covers
              if (isMember) {
                setCurrentStep("completed");
                toast.success("Jesteś już w pełni zarejestrowany jako członek szkoły!");
                setTimeout(() => router.push("/teacher/courses"), 2000);
              } else if (hasStripe && hasSubscription) {
                // Fully registered with everything
                setCurrentStep("completed");
                toast.success("Jesteś już w pełni zarejestrowany!");
                setTimeout(() => router.push("/teacher/courses"), 2000);
              } else if (hasStripe && !hasSubscription) {
                // Has Stripe, needs subscription
                setCurrentStep("platform-subscription");
                toast("Wybierz plan subskrypcji platformy", { icon: "💳" });
              } else {
                // Needs Stripe setup
                setCurrentStep("stripe-setup");
                toast("Witaj ponownie! Dokończymy rejestrację.", { icon: "👋" });
              }
            }
          }
          
          setUserCheckCompleted(true);
          return;
        }

        // Status 206: User exists but profile incomplete
        if (updateProviderResponse.status === 206) {
          const partialData = await updateProviderResponse.json();
          console.log('[checkUserStatus] User found with incomplete profile, providerId updated');
          
          // Continue normal registration flow to complete profile
          const roleId = partialData.user?.roleId;
          if (roleId === 0) {
            // Student with incomplete profile
            setSelectedRole("student");
            setCurrentStep("terms-consent");
            toast("Witaj ponownie! Uzupełnij swoje dane.", { icon: "👋" });
          } else if (roleId === 1) {
            // Teacher with incomplete profile
            setSelectedRole("teacher");
            if (success === 'stripe') {
              // Wracamy ze Stripe — skieruj od razu do subskrypcji platformy z danymi szkoły
              const schoolForData = partialData.ownedSchools?.[0] || partialData.schoolMemberships?.[0]?.school;
              const effectiveSchoolType = (schoolForData?.schoolType as "individual" | "business" | undefined)
                || currentSchoolTypeRef.current
                || (businessDataRef.current.businessType === 'company' ? 'business' : 'individual');
              const businessTypeFromSchool = effectiveSchoolType === 'business' ? 'company' : 'individual';

              setCurrentSchoolType(effectiveSchoolType);

              setBusinessData(prev => ({
                ...prev,
                businessType: prev.businessType && prev.businessType !== 'join-school' ? prev.businessType : businessTypeFromSchool,
                joinSchoolMode: prev.joinSchoolMode || 'own-school',
                companyName: prev.companyName || schoolForData?.companyName || "",
                schoolName: prev.schoolName || schoolForData?.name || "",
                taxId: prev.taxId || schoolForData?.taxId || "",
                requiresVatInvoices: typeof prev.requiresVatInvoices === 'boolean' ? prev.requiresVatInvoices : (schoolForData?.requiresVatInvoices || false),
                selectedSchoolId: prev.selectedSchoolId || schoolForData?.id,
              }));

              setCurrentStep("platform-subscription");
              toast.success('Konto Stripe skonfigurowane. Wybierz plan platformy.');
            } else if (success === 'subscription') {
              toast.success('Płatność za platformę została przetworzona! Rejestracja zakończona.');
              setCurrentStep("completed");
              setTimeout(() => router.push("/teacher/courses"), 1500);
            } else {
              setCurrentStep("business-type-selection");
              toast("Witaj ponownie! Dokończymy rejestrację.", { icon: "👋" });
            }
          }
          
          setUserCheckCompleted(true);
          return;
        }

        // If status 404: User not found - proceed with normal check and potentially new registration
        if (updateProviderResponse.status === 404) {
          console.log('[checkUserStatus] User not found by email, checking by providerId');
        }

        // Fallback: Try to find user by providerId (for existing users with same provider)
        const response = await fetch(`/api/user?userId=${userId}&sessionId=${sessionId}`);
        
        if (response.ok) {
          const userData = await response.json();
          
          console.log('[checkUserStatus] User data received:', {
            exists: userData.exists,
            roleId: userData.roleId,
            schoolId: userData.schoolId,
            school: userData.school
          });
          
          if (userData.exists) {
            // User exists in database
            const isTeacher = userData.roleId === 1;
            const isStudent = userData.roleId === 0;
            
            if (isStudent) {
              // Student is fully registered
              setSelectedRole("student");
              setCurrentStep("completed");
              toast.success("Jesteś już zarejestrowany jako uczeń!");
              setTimeout(() => router.push("/"), 2000);
            } else if (isTeacher) {
              setSelectedRole("teacher");
              
              // Check if returning from Stripe
              if (success === 'stripe') {
                console.log("Returning from Stripe with success=stripe. userData:", userData);
                toast.success('Konto Stripe zostało skonfigurowane! Teraz wybierz plan subskrypcji platformy.');
                setBusinessData(prev => ({
                  ...prev,
                  businessType: prev.businessType || (currentSchoolTypeRef.current === 'business' ? 'company' : 'individual'),
                  joinSchoolMode: prev.joinSchoolMode || 'own-school'
                }));
                if (!currentSchoolTypeRef.current) {
                  const chosenBusinessType = businessDataRef.current.businessType || (currentSchoolTypeRef.current === 'business' ? 'company' : 'individual');
                  const fallbackType = chosenBusinessType === 'company' ? 'business' : 'individual';
                  setCurrentSchoolType(fallbackType);
                }
                setCurrentStep("platform-subscription");
              } else if (success === 'subscription') {
                toast.success('Płatność za platformę została przetworzona! Rejestracja zakończona.');
                setCurrentStep("completed");
                setTimeout(() => router.push("/teacher/courses"), 2000);
              } else if (refresh === 'true') {
                toast.error('Konfiguracja Stripe została przerwana. Możesz spróbować ponownie.');
                setCurrentStep("stripe-setup");
              } else {
                // Check what's missing for teacher
              const hasStripe = userData.stripeAccountId && userData.stripeOnboardingComplete;
                const hasSubscription = userData.hasActiveSubscription;
                
                if (hasSubscription) {
                  // Fully registered
                  setCurrentStep("completed");
                  toast.success("Jesteś już w pełni zarejestrowany!");
                  setTimeout(() => router.push("/teacher/courses"), 2000);
                } else if (hasStripe) {
                  // Has Stripe, needs subscription
                  setCurrentStep("platform-subscription");
                  toast("Wybierz plan subskrypcji platformy", { icon: "💳" });
                } else {
                  // Check if teacher has school - if yes, populate business data and skip to terms
                  console.log('[checkUserStatus] Checking for school:', {
                    hasSchoolId: !!userData.schoolId,
                    hasSchool: !!userData.school,
                    schoolId: userData.schoolId,
                    school: userData.school
                  });
                  
                  if (userData.schoolId && userData.school) {
                    // Populate businessData with school information from API response
                    const businessType = (userData.school.schoolType === "business" ? "company" : "individual") as "individual" | "company";
                    const newBusinessData: BusinessTypeData = {
                      businessType: businessType,
                      companyName: userData.school.companyName || "",
                      schoolName: userData.school.name || "",
                      taxId: userData.school.taxId || "",
                      requiresVatInvoices: userData.school.requiresVatInvoices || false,
                      joinSchoolMode: "own-school",
                      selectedSchoolId: userData.school.id
                    };
                    
                    console.log('[checkUserStatus] Setting business data:', newBusinessData);
                    setBusinessData(newBusinessData);
                    setCurrentSchoolType(userData.school.schoolType as "individual" | "business");
                    
                    console.log('[checkUserStatus] School data loaded:', {
                      schoolType: userData.school.schoolType,
                      companyName: userData.school.companyName,
                      schoolName: userData.school.name,
                      taxId: userData.school.taxId
                    });
                    
                    setCurrentStep("terms-consent");
                    toast.success("Masz już przypisaną szkołę! Zaakceptuj regulamin, aby kontynuować.", { icon: "🏫" });
                  } else if (userData.schoolId) {
                    // Has schoolId but school data not fetched - still proceed to terms
                    console.log('[checkUserStatus] Has schoolId but no school data');
                    setCurrentStep("terms-consent");
                    toast.success("Masz już przypisaną szkołę! Zaakceptuj regulamin, aby kontynuować.", { icon: "🏫" });
                  } else {
                    // Needs business type selection
                    setCurrentStep("business-type-selection");
                    toast("Rozpocznij rejestrację od wyboru typu działalności", { icon: "👨‍🏫" });
                  }
                }
              }
            }
          } else {
            // User doesn't exist - show role selection
            setCurrentStep("role-selection");
          }
        }
        
        // Clean URL
        if (success || refresh) {
          window.history.replaceState({}, '', '/register');
        }
      } catch (error) {
        console.error("Error checking user status:", error);
      } finally {
        setUserCheckCompleted(true);
        setIsLoading(false);
        setLoadingState("idle");
      }
    };

    checkUserStatus();
  }, [isSignedIn, userId, sessionId, router]);

  // Block page navigation during redirect states (but not for Stripe redirect)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (loadingState === "creating-platform-subscription" || loadingState === "completing-registration") {
        e.preventDefault();
        e.returnValue = "Rejestracja jest w toku. Czy na pewno chcesz opuścić tę stronę?";
        return e.returnValue;
      }
    };

    const handlePopState = (e: PopStateEvent) => {
      if (loadingState === "creating-platform-subscription" || loadingState === "completing-registration") {
        e.preventDefault();
        // Push the current state back to prevent navigation
        window.history.pushState(null, "", window.location.href);
        toast.error("Proszę poczekać na zakończenie przekierowywania");
      }
    };

    if (loadingState === "creating-platform-subscription" || loadingState === "completing-registration") {
      window.addEventListener("beforeunload", handleBeforeUnload);
      window.addEventListener("popstate", handlePopState);
      
      // Push current state to prevent back button
      window.history.pushState(null, "", window.location.href);
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [loadingState]);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                       window.innerWidth <= 768;
      setIsMobileDevice(isMobile);
      console.log("Mobile device detected:", isMobile, "User agent:", navigator.userAgent);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getLoadingMessage = (state: LoadingState): string => {
    const messages = {
      "idle": "",
      "creating-user": "Tworzenie konta użytkownika...",
      "creating-stripe-account": "Przygotowywanie konta płatności...",
      "redirecting-to-stripe": "Przekierowywanie do Stripe...",
      "updating-user": "Aktualizowanie danych użytkownika...",
      "creating-platform-subscription": "Przygotowywanie subskrypcji platformy...",
      "completing-registration": "Finalizowanie rejestracji...",
      "sending-join-request": "Wysyłanie prośby o dołączenie..."
    };
    return messages[state];
  };

  const ProgressIndicator = ({ currentStep, selectedRole }: { currentStep: RegistrationStep; selectedRole: "student" | "teacher" | null }) => {
    if (!selectedRole || currentStep === "role-selection") return null;
    
    const steps = selectedRole === "teacher" 
      ? ["Wybór roli", "Regulamin", "Typ działalności", "Wybór szkoły", "Tworzenie konta", "Konfiguracja płatności", "Subskrypcja platformy", "Zakończone"]
      : ["Wybór roli", "Regulamin", "Tworzenie konta", "Zakończone"];
    
    const normalizeStepForProgress = (step: RegistrationStep): RegistrationStep => {
      if (step === "find-school") return "school-choice";
      if (step === "user-creation") return "terms-acceptance";
      return step;
    };

    const stepOrder: RegistrationStep[] = selectedRole === "teacher"
      ? [
          "role-selection",
          "terms-consent",
          "business-type-selection",
          "school-choice",
          "terms-acceptance",
          "stripe-setup",
          "platform-subscription",
          "completed",
        ]
      : ["role-selection", "terms-consent", "terms-acceptance", "completed"];

    const currentNormalizedStep = normalizeStepForProgress(currentStep);
    const currentStepNumber = Math.max(1, stepOrder.indexOf(currentNormalizedStep) + 1);
    const totalSteps = steps.length;
    
    return (
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs sm:text-sm font-medium text-gray-700">Postęp rejestracji</span>
          <span className="text-xs sm:text-sm text-gray-500">{currentStepNumber}/{totalSteps}</span>
        </div>
        <div className="flex items-center justify-center space-x-1 sm:space-x-2 overflow-x-auto">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStepNumber;
            const isCurrent = stepNumber === currentStepNumber;
            
            return (
              <div key={index} className="flex items-center flex-shrink-0">
                <div
                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-colors
                    ${isCompleted 
                      ? `${selectedRole === "student" ? "bg-orange-500 border-orange-500" : "bg-blue-500 border-blue-500"} text-white` 
                      : isCurrent 
                        ? `${selectedRole === "student" ? "border-orange-500 text-orange-500" : "border-blue-500 text-blue-500"} bg-white`
                        : "border-gray-300 text-gray-400 bg-white"
                    }`}
                >
                  {isCompleted ? "✓" : stepNumber}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-4 sm:w-8 h-0.5 mx-1 transition-colors flex-shrink-0
                      ${isCompleted 
                        ? selectedRole === "student" ? "bg-orange-500" : "bg-blue-500"
                        : "bg-gray-300"
                      }`}
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-2 text-xs sm:text-sm text-gray-600 text-center px-2">
          {steps[currentStepNumber - 1]}
        </div>
      </div>
    );
  };

  const handleSignUp = async () => {
    if (!isSignedIn) {
      setRegistrationError("Zaloguj się, aby zakończyć rejestrację");
      toast.error("Zaloguj się, aby zakończyć rejestrację");
      return;
    }
    if (!acceptTerms) {
      setRegistrationError("Aby się zarejestrować, musisz zaakceptować regulamin");
      toast.error("Aby się zarejestrować, musisz zaakceptować regulamin.");
      return;
    }

    let termsAcceptanceLogged = false;
    const recordTermsAcceptanceOnce = async () => {
      if (termsAcceptanceLogged) return;
      if (!selectedRole) return;

      termsAcceptanceLogged = true;
      try {
        const documentType = selectedRole === "student" ? "TERMS_STUDENT" : "TERMS_TEACHER";

        await fetch("/api/legal/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: documentType,
            version: TERMS_VERSION,
            effectiveAt: `${TERMS_EFFECTIVE_DATE_ISO}T00:00:00.000Z`,
            lastUpdatedAt: `${TERMS_LAST_UPDATE_ISO}T00:00:00.000Z`,
            locale: typeof navigator !== "undefined" ? (navigator.language || "pl").slice(0, 2) : "pl",
            context: "register",
          }),
        });
      } catch (error) {
        console.warn("[handleSignUp] Could not record terms acceptance:", error);
      }
    };

    setRegistrationError(null);
    const roleId = selectedRole === "student" ? 0 : 1;
    
    try {
      setIsLoading(true);
      setLoadingState("creating-user");
      
      // First, try to update providerId for existing user with complete profile
      const updateProviderResponse = await fetch("/api/user/update-provider-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      // Status 200: User exists with complete profile - update providerId and redirect
      if (updateProviderResponse.status === 200) {
        const updateData = await updateProviderResponse.json();
        console.log('[handleSignUp] Status:', updateProviderResponse.status);
        console.log('[handleSignUp] Response headers:', {
          'content-type': updateProviderResponse.headers.get('content-type'),
          'status': updateProviderResponse.status,
          'statusText': updateProviderResponse.statusText
        });
        console.log('[handleSignUp] Full response body:', updateData);
        console.log('[handleSignUp] Response keys:', Object.keys(updateData));
        console.log('[handleSignUp] updateData.user:', updateData.user);
        console.log('[handleSignUp] isTeacher?', updateData.isTeacher);
        console.log('[handleSignUp] schoolId?', updateData.schoolId);
        console.log('[handleSignUp] ownedSchools:', updateData.ownedSchools);
        console.log('[handleSignUp] schoolMemberships:', updateData.schoolMemberships);
        console.log('[handleSignUp] Detailed check - isTeacher:', updateData.isTeacher, 'schoolId:', updateData.schoolId, 'condition result:', !!(updateData.isTeacher && updateData.schoolId));
        
        // If teacher with school, set businessData based on schoolType
        if (updateData.isTeacher && updateData.schoolId) {
          console.log('[handleSignUp] ENTERING teacher with school block');
          const ownsSchool = !!updateData.ownedSchools?.[0];
          const membershipSchool = updateData.schoolMemberships?.[0];
          const isMemberOfOtherSchool = !!(membershipSchool && (!ownsSchool || membershipSchool.schoolId !== updateData.ownedSchools?.[0]?.id));
          const school = updateData.ownedSchools?.[0] || membershipSchool?.school;
          console.log('[handleSignUp] school object:', school, 'isMemberOfOtherSchool:', isMemberOfOtherSchool, 'ownsSchool:', ownsSchool);
          const schoolType = school?.schoolType || "individual";
          
          console.log('[handleSignUp] Setting businessData based on school type:', schoolType);
          const newBusinessType = schoolType === "business" ? "company" : "individual";
          console.log('[handleSignUp] New businessType will be:', newBusinessType);
          
          // Set schoolType state for platform-subscription step
          setCurrentSchoolType(schoolType as "individual" | "business");
          
          // Check if teacher has active platform subscription (from API response)
          const hasActiveSubscription = updateData.hasActiveSubscription;
          const stripeOnboardingComplete = updateData.stripeOnboardingComplete;
          
          console.log('[handleSignUp] hasActiveSubscription:', hasActiveSubscription, 'stripeOnboardingComplete:', stripeOnboardingComplete, 'isMemberOfOtherSchool:', isMemberOfOtherSchool, 'ownsSchool:', ownsSchool);
          
          // If teacher is a member of another school, they don't pay individually - school owner's subscription covers them
          if (isMemberOfOtherSchool) {
            console.log('[handleSignUp] Teacher is member of school - no need to pay, logging in directly');
            setBusinessData(prev => ({
              ...prev,
              businessType: newBusinessType,
              joinSchoolMode: "join-existing-school",
              selectedSchoolId: school?.id
            }));
          } else if (!stripeOnboardingComplete || !hasActiveSubscription) {
            // Teacher needs to complete Stripe setup or subscribe to platform
            console.log('[handleSignUp] Teacher needs Stripe/subscription, stripeOnboardingComplete:', stripeOnboardingComplete, 'hasActiveSubscription:', hasActiveSubscription);
            const newData: BusinessTypeData = {
              businessType: newBusinessType as "individual" | "company",
              companyName: school?.companyName || "",
              schoolName: school?.name || "",
              taxId: school?.taxId || "",
              requiresVatInvoices: school?.requiresVatInvoices || false,
              joinSchoolMode: "own-school",
              selectedSchoolId: school?.id
            };
            console.log('[handleSignUp] Prepared data:', newData);
            console.log('[handleSignUp] About to set pendingBusinessData with:', newData);
            setPendingBusinessData(newData);
            
            // Set to appropriate next step based on what's missing
            if (!stripeOnboardingComplete) {
              console.log('[handleSignUp] Stripe not complete, setting currentStep to stripe-setup');
              setBusinessData(newData);
              setCurrentStep("stripe-setup");
            } else {
              console.log('[handleSignUp] Stripe complete but no subscription, will go to platform-subscription');
              setNeedsPlatformSubscription(true);
            }
            
            setIsLoading(false);
            setLoadingState("idle");
            console.log('[handleSignUp] Returning early, state will be updated');

            await recordTermsAcceptanceOnce();
            return;
          } else {
            // Already has both Stripe and subscription, just update businessData for future use
            console.log('[handleSignUp] Teacher has everything, logging in directly');
            setBusinessData(prev => ({
              ...prev,
              businessType: newBusinessType,
              joinSchoolMode: "own-school"
            }));
          }
        }

        await recordTermsAcceptanceOnce();
        
        toast.success("Konto znalezione! Witaj ponownie!");
        setCurrentStep("completed");
        
        setTimeout(() => {
          // Redirect based on role
          if (selectedRole === "teacher") {
            router.push("/teacher/courses");
          } else {
            router.push("/");
          }
          router.refresh();
        }, 1000);
        
        return;
      }

      // Status 206: User exists but profile incomplete - update providerId but continue registration
      if (updateProviderResponse.status === 206) {
        const partialData = await updateProviderResponse.json();
        console.log('[handleSignUp] User exists with incomplete profile, providerId updated:', partialData.user?.id);
        
        toast("Konto znalezione! Proszę uzupełnić pozostałe dane.", { icon: "ℹ️" });
        
        // ProviderId is now updated, so skip the normal providerId update step
        // Continue with profile completion flow
      } else if (updateProviderResponse.status === 404) {
        // Status 404: User not found - will create new one
        console.log('[handleSignUp] User not found, will create new one');
      }

      // If update failed (user doesn't exist or has incomplete profile), proceed with normal registration
      const checkResponse = await fetch(`/api/user?userId=${userId}&sessionId=${sessionId}`);
      let userExists = false;
      
      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        userExists = checkData.exists;
      }
      
      if (!userExists) {
        // Create user only if doesn't exist
        // For teachers, user should already be created in handleRoleSelection
        // For students, create now
        setCurrentStep("user-creation");
        
        const requestBody: any = { userId, sessionId, roleId };
        if (selectedRole === "teacher") {
          requestBody.businessData = businessData;
        }
        
        const response = await fetch("/api/user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });
        
        if (!response.ok) {
          let errorMessage = "Rejestracja nie powiodła się";
          
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (parseError) {
            try {
              const errorText = await response.text();
              console.error("User API returned non-JSON error:", errorText);
              errorMessage = `Błąd serwera (${response.status}): ${errorText.slice(0, 100)}...`;
            } catch {
              errorMessage = `Błąd serwera (${response.status})`;
            }
          }
          
          throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log('[handleRegister] User creation response:', { 
          created: result.created, 
          schoolId: result.schoolId,
          businessMode: businessData.joinSchoolMode 
        });
        toast.success("Konto użytkownika utworzone pomyślnie!");

        await recordTermsAcceptanceOnce();
      } else {
        toast("Konto już istnieje, kontynuuję rejestrację...", { icon: "ℹ️" });
        
        // For teachers, update businessData if needed
        if (selectedRole === "teacher") {
          try {
            const updateResponse = await fetch("/api/user/update-business-data", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                businessData: businessData
              }),
            });
            
            if (!updateResponse.ok) {
              console.warn("Could not update business data, continuing anyway");
            }
          } catch (error) {
            console.warn("Error updating business data:", error);
            // Continue anyway - business data might already be set
          }
        }

        await recordTermsAcceptanceOnce();
      }
      
      // Handle next steps based on role
      if (selectedRole === "student") {
        setCurrentStep("completed");
        toast.success("Rejestracja zakończona sukcesem!");
        
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1000);
      } else if (selectedRole === "teacher") {
        // Check if teacher joined a school or is creating their own
        if (businessData.joinSchoolMode === "join-existing-school" && businessData.selectedSchoolId) {
          // Teacher joining a school - they don't need to pay, school owner covers subscription
          // Send join request first, then complete registration
          setLoadingState("sending-join-request");
          try {
            const joinResponse = await fetch("/api/schools/join-request", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ schoolId: businessData.selectedSchoolId }),
            });

            if (!joinResponse.ok) {
              const joinError = await joinResponse.json();
              throw new Error(joinError.error || "Nie udało się wysłać prośby o dołączenie");
            }

            toast.success("Prośba o dołączenie do szkoły została wysłana! Szkoła zajmuje się płatnościami.");
          } catch (joinError) {
            console.error("Error sending join request:", joinError);
            const errorMsg = joinError instanceof Error ? joinError.message : "Błąd przy wysyłaniu prośby";
            toast.error(errorMsg);
          }

          setCurrentStep("completed");
          
          setTimeout(() => {
            router.push("/teacher/courses");
            router.refresh();
          }, 1500);
        } else {
          // All other teachers (individual or own-school) need to set up Stripe
          console.log('[handleRegister] Teacher needs Stripe setup');
          setCurrentStep("stripe-setup");
        }
      }
      
    } catch (error) {
      console.error("Błąd rejestracji użytkownika:", error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Nie udało się zarejestrować";
        
      setRegistrationError(errorMessage);
      toast.error(errorMessage);
      setCurrentStep("terms-acceptance");
    } finally {
      setIsLoading(false);
      setLoadingState("idle");
    }
  };

  const handleStripeSetup = async () => {
    if (!isSignedIn) {
      toast.error("Musisz być zalogowany");
      return;
    }

    try {
      setIsLoading(true);
      setLoadingState("creating-stripe-account");
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const stripeResponse = await fetch("/api/stripe/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessType: businessData.businessType
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeout);
      
      if (!stripeResponse.ok) {
        let errorMessage = "Nie udało się utworzyć konta płatności";
        
        try {
          const stripeError = await stripeResponse.json();
          errorMessage = stripeError.message || errorMessage;
        } catch (parseError) {
          try {
            const errorText = await stripeResponse.text();
            console.error("Stripe API returned non-JSON error:", errorText);
            errorMessage = `Błąd serwera (${stripeResponse.status}): ${errorText.slice(0, 100)}...`;
          } catch {
            errorMessage = `Błąd serwera (${stripeResponse.status})`;
          }
        }
        
        throw new Error(errorMessage);
      }

      const stripeResult = await stripeResponse.json();
      
      console.log("Stripe Connect response:", stripeResult);
      
      if (stripeResult.onboardingUrl) {
        setLoadingState("redirecting-to-stripe");
        toast.success("Przekierowujemy Cię do konfiguracji konta płatności...");
        
        setTimeout(() => {
          window.location.href = stripeResult.onboardingUrl;
        }, 1500);
        return;
      } else if (stripeResult.onboardingComplete || stripeResult.existingAccount) {
        // Account already configured, proceed to subscription
        console.log("Account already configured, proceeding to subscription");
        toast.success("Konto płatności już skonfigurowane! Przejdź do wyboru planu.");
        setIsLoading(false);
        setLoadingState("idle");
        setCurrentStep("platform-subscription");
      } else {
        throw new Error("Nie otrzymano linku do konfiguracji konta płatności");
      }
      
    } catch (stripeError) {
      console.error("Błąd konfiguracji Stripe:", stripeError);
      
      let stripeErrorMessage = "Błąd podczas konfiguracji konta płatności";
      
      if (stripeError instanceof Error) {
        if (stripeError.name === 'AbortError') {
          stripeErrorMessage = "Timeout: Żądanie do konfiguracji Stripe trwało zbyt długo. Spróbuj ponownie.";
        } else {
          stripeErrorMessage = stripeError.message;
        }
      }
        
      setRegistrationError(`${stripeErrorMessage}. Możesz dokończyć konfigurację później w panelu nauczyciela.`);
      toast.error(stripeErrorMessage);
      setIsLoading(false);
      setLoadingState("idle");
    }
  };

  const handlePlatformSubscription = async (subscriptionType: "individual" | "school") => {
    if (!selectedRole || selectedRole !== "teacher") return;
    
    try {
      setIsLoading(true);
      setLoadingState("creating-platform-subscription");
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch("/api/platform-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptionType: subscriptionType
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeout);
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.sessionUrl) {
          // Redirect to Stripe Checkout
          toast.success("Przekierowywanie do płatności...");
          setLoadingState("redirecting-to-stripe");
          
          setTimeout(() => {
            window.location.href = result.sessionUrl;
          }, 1500);
          return;
        } else {
          throw new Error("Nie otrzymano linka do płatności");
        }
      } else {
        let errorMessage = "Błąd podczas tworzenia subskrypcji platformy";
        let errorData = null;
        
        try {
          errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          
          // Check if it's because user already has active subscription
          if (errorData.existing && errorData.error?.includes("already has an active")) {
            console.log("User already has active subscription");
            toast.success("Już posiadasz aktywną subskrypcję platformy!");
            setCurrentStep("completed");
            setTimeout(() => {
              router.push("/teacher/courses");
            }, 2000);
            return;
          }
        } catch (parseError) {
          try {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
          } catch {
            errorMessage = `Błąd serwera (${response.status})`;
          }
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Platform subscription error:", error);
      
      let errorMessage = "Błąd subskrypcji platformy";
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = "Timeout: Żądanie do systemu płatności trwało zbyt długo. Spróbuj ponownie.";
        } else {
          errorMessage = error.message;
        }
      }
      
      setRegistrationError(errorMessage + ". Możesz skonfigurować to później w panelu nauczyciela.");
      toast.error(errorMessage + ". Możesz to zrobić później w panelu nauczyciela.");
      
      // Allow user to proceed to completion
      setCurrentStep("completed");
      setTimeout(() => {
        router.push("/teacher/courses");
      }, 3000);
    } finally {
      setIsLoading(false);
      setLoadingState("idle");
    }
  };

  const touchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleRoleSelection = useCallback(async (role: "student" | "teacher") => {
    console.log("Role selection clicked:", role); // Debug log for mobile testing
    
    // Prevent any concurrent selections or during redirect states
    if (isLoading || selectedRole || loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration") {
      return;
    }
    
    // Clear any pending touch timeout
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
    }
    
    setSelectedRole(role);
    setCurrentStep("terms-consent");
    setAcceptTerms(false);
    setRegistrationError(null);
    setLoadingState("idle");

    if (role === "teacher") {
      toast.success("Wybrano rolę: nauczyciel. Zaakceptuj regulamin, aby kontynuować.");
    } else {
      toast.success("Wybrano rolę: uczeń. Zaakceptuj regulamin, aby kontynuować.");
    }
  }, [isLoading, selectedRole, loadingState]);

  // Mobile-optimized touch handler
  const createTouchHandler = useCallback((role: "student" | "teacher") => {
    return {
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isLoading && !selectedRole && loadingState !== "redirecting-to-stripe" && loadingState !== "creating-platform-subscription" && loadingState !== "completing-registration") {
          handleRoleSelection(role);
        }
      },
      onTouchEnd: (e: React.TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isLoading && !selectedRole && loadingState !== "redirecting-to-stripe" && loadingState !== "creating-platform-subscription" && loadingState !== "completing-registration") {
          // Small delay to prevent double-firing
          touchTimeoutRef.current = setTimeout(() => {
            handleRoleSelection(role);
          }, 50);
        }
      },
      onTouchStart: (e: React.TouchEvent) => {
        // Prevent default to avoid ghost clicks
        e.preventDefault();
      }
    };
  }, [isLoading, selectedRole, handleRoleSelection, loadingState]);

  const handleBusinessTypeSelection = async () => {
    // Block navigation during redirect states
    if (loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration") {
      return;
    }
    
    if (!isSignedIn) {
      setRegistrationError("Zaloguj się, aby kontynuować");
      return;
    }

    // Walidacja - NIP wymagany dla spółek i dla JDG (individual z requiresVatInvoices)
    if (businessData.businessType === "company" && (!businessData.schoolName || !businessData.companyName || !businessData.taxId)) {
      setRegistrationError("Dla spółki wymagana jest nazwa szkoły, nazwa firmy i NIP");
      return;
    }
    
    // Dla individual - NIP wymagany tylko gdy chce wystawiać faktury (JDG)
    if (businessData.businessType === "individual" && businessData.requiresVatInvoices && !businessData.taxId) {
      setRegistrationError("NIP jest wymagany dla JDG, jeśli chcesz wystawiać faktury VAT");
      return;
    }

    // Handle different business types
    if (businessData.businessType === "join-school") {
      // Load schools list for joining
      setSchoolsLoading(true);
      setBusinessData(prev => ({ ...prev, joinSchoolMode: "join-existing-school" }));
      try {
        const response = await fetch("/api/schools/list");
        if (response.ok) {
          const data = await response.json();
          setSchools(data);
          setCurrentStep("find-school");
        } else {
          toast.error("Nie udało się załadować listy szkół");
        }
      } catch (error) {
        console.error("Error fetching schools:", error);
        toast.error("Błąd podczas ładowania listy szkół");
      } finally {
        setSchoolsLoading(false);
      }
    } else if (businessData.businessType === "company") {
      // For company (new school), mark as own-school but stay at business type to confirm
      setBusinessData(prev => ({ ...prev, joinSchoolMode: "own-school" }));
      setCurrentStep("terms-acceptance");
    } else {
      // For individual, skip to terms
      setCurrentStep("terms-acceptance");
    }
    setRegistrationError(null);
  };

  const handleSchoolChoice = async (choice: "own-school" | "join-existing-school") => {
    setBusinessData(prev => ({ ...prev, joinSchoolMode: choice }));
    
    if (choice === "join-existing-school") {
      // Load schools list
      setSchoolsLoading(true);
      try {
        const response = await fetch("/api/schools/list");
        if (response.ok) {
          const data = await response.json();
          setSchools(data);
          setCurrentStep("find-school");
        } else {
          toast.error("Nie udało się załadować listy szkół");
          setCurrentStep("school-choice");
        }
      } catch (error) {
        console.error("Error fetching schools:", error);
        toast.error("Błąd podczas ładowania listy szkół");
        setCurrentStep("school-choice");
      } finally {
        setSchoolsLoading(false);
      }
    } else {
      // Skip to terms if creating own school
      setCurrentStep("terms-acceptance");
    }
    setRegistrationError(null);
  };

  const handleJoinSchool = async (schoolId: number) => {
    // Just save the selected school and proceed to terms acceptance
    setBusinessData(prev => ({ ...prev, selectedSchoolId: schoolId }));
    setCurrentStep("terms-acceptance");
  };

  const handleBackToBusinessType = () => {
    // Block navigation during redirect states
    if (loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration") {
      return;
    }
    
    setCurrentStep("business-type-selection");
    setRegistrationError(null);
  };

  const handleBackToTermsConsent = () => {
    // Block navigation during redirect states
    if (loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration") {
      return;
    }

    setCurrentStep("terms-consent");
    setRegistrationError(null);
  };

  const handleBackToRoleSelection = () => {
    // Block navigation during redirect states
    if (loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration") {
      return;
    }
    
    setSelectedRole(null);
    setCurrentStep("role-selection");
    setAcceptTerms(false);
    setRegistrationError(null);
    setLoadingState("idle");
  };

  const ErrorAlert = ({ error }: { error: string }) => (
    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex">
        <div className="flex-shrink-0">
          <span className="text-red-400">⚠️</span>
        </div>
        <div className="ml-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    </div>
  );

  // Show loading while checking user status
  if (!userCheckCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-blue-50">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Sprawdzanie stanu rejestracji...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile-specific styles */}
      <style jsx>{`
        /* Ensure proper touch behavior on mobile */
        * {
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
        
        /* Allow text selection for inputs and text areas */
        input, textarea, [contenteditable] {
          -webkit-user-select: text;
          -khtml-user-select: text;
          -moz-user-select: text;
          -ms-user-select: text;
          user-select: text;
        }

        /* Ensure proper touch targets */
        button, [role="button"] {
          min-height: 44px;
          min-width: 44px;
        }

        /* Custom radio button styling */
        input[type="radio"] {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          width: 18px;
          height: 18px;
          border: 2px solid #d1d5db;
          border-radius: 50%;
          background-color: white;
          cursor: pointer;
          position: relative;
          margin: 0;
          flex-shrink: 0;
        }

        input[type="radio"]:checked {
          border-color: #3b82f6;
          background-color: white;
        }

        input[type="radio"]:checked::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 8px;
          height: 8px;
          background-color: #3b82f6;
          border-radius: 50%;
        }

        input[type="radio"]:hover {
          border-color: #6b7280;
        }

        input[type="radio"]:checked:hover {
          border-color: #2563eb;
        }

        input[type="radio"]:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        /* Prevent horizontal scroll on mobile */
        @media (max-width: 640px) {
          body {
            overflow-x: hidden;
          }
          
          /* Ensure content fits in viewport */
          .registration-container {
            max-width: 100vw;
            margin: 0;
            padding: 0.5rem;
          }

          /* Smaller radio buttons on mobile */
          input[type="radio"] {
            width: 16px;
            height: 16px;
          }

          input[type="radio"]:checked::after {
            width: 6px;
            height: 6px;
          }
        }
        
        /* Disabled state for navigation blocking during redirects */
        .navigation-blocked {
          pointer-events: none !important;
          opacity: 0.5 !important;
          cursor: not-allowed !important;
        }
      `}</style>
      
      {(loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration") && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full text-center shadow-xl">
            <div className="mb-4">
              <Loader2 className="animate-spin mx-auto" size={40} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {loadingState === "redirecting-to-stripe" ? "Przygotowywanie przekierowania..." : loadingState === "creating-platform-subscription" ? "Przetwarzanie płatności..." : "Finalizowanie rejestracji..."}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {loadingState === "redirecting-to-stripe" 
                ? "Za chwilę zostaniesz przekierowany na bezpieczną stronę Stripe do konfiguracji konta płatności."
                : loadingState === "creating-platform-subscription"
                ? "Przekierowujemy Cię do systemu płatności platformy..."
                : "Przekierowujemy Cię do panelu nauczyciela..."}
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-700">
                ⚠️ Proszę nie zamykać tej strony i nie korzystać z przeglądarki podczas przekierowywania.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white p-2 sm:p-4">
        <div className="registration-container flex flex-col items-center w-full max-w-sm sm:max-w-lg mx-auto text-center p-3 sm:p-6 space-y-3 sm:space-y-6 bg-white rounded-lg sm:rounded-xl shadow-lg border border-orange-100">
        <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-orange-700 leading-tight">Witamy w Ecurs!</h1>
        <p className="text-sm sm:text-base text-gray-600 px-1 sm:px-2 leading-relaxed">
          Dołącz do naszej platformy edukacyjnej, aby uzyskać dostęp do wszystkich kursów, zasobów i spersonalizowanych doświadczeń edukacyjnych.
        </p>
        <div className="w-12 sm:w-16 h-1 bg-orange-500 mx-auto my-1 sm:my-2 rounded"></div>
        
        <ProgressIndicator currentStep={currentStep} selectedRole={selectedRole} />
        
        {/* Mobile Debug Info - Remove in production */}
        {/* {isMobileDevice && (
          <div className="mb-2 p-2 bg-gray-100 border border-gray-300 rounded text-xs">
            <div>📱 Mobile Mode: {isMobileDevice ? "Yes" : "No"}</div>
            <div>📊 Current Step: {currentStep}</div>
            <div>👤 Selected Role: {selectedRole || "None"}</div>
            <div>🔄 Loading: {isLoading ? "Yes" : "No"}</div>
          </div>
        )} */}
        
        {registrationError && <ErrorAlert error={registrationError} />}
        
        {loadingState !== "idle" && (
          <div className="w-full p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="animate-spin" size={20} />
              <span className="text-sm text-blue-700 font-medium">
                {getLoadingMessage(loadingState)}
              </span>
            </div>
            {(loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration") && (
              <div className="mt-2 text-xs text-blue-600 text-center">
                Proszę nie zamykać tej strony i nie korzystać z przycisków nawigacji podczas przekierowywania...
              </div>
            )}
          </div>
        )}
        
        <div className="w-full">
          {!selectedRole ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Wybierz swoją rolę:</h2>
              <div className="flex flex-col gap-3 sm:gap-4">
                {isMobileDevice ? (
                  // Mobile-optimized divs for better touch handling
                  <>
                    <div
                      className={`w-full py-4 px-4 sm:px-8 rounded-lg font-medium text-white text-base sm:text-lg bg-orange-600 hover:bg-orange-700 active:bg-orange-800 transition-colors flex items-center justify-center gap-2 cursor-pointer touch-manipulation select-none
                        ${(isLoading || loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration") ? "opacity-50 pointer-events-none" : ""}`}
                      onClick={() => {
                        console.log("Mobile div click - student");
                        if (!isLoading && !selectedRole && loadingState !== "redirecting-to-stripe" && loadingState !== "creating-platform-subscription" && loadingState !== "completing-registration") {
                          handleRoleSelection("student");
                        }
                      }}
                      onTouchStart={(e) => {
                        if (loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration") {
                          e.preventDefault();
                          return;
                        }
                        console.log("Mobile touch start - student");
                        e.currentTarget.style.backgroundColor = '#ea580c';
                      }}
                      onTouchEnd={(e) => {
                        if (loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration") {
                          e.preventDefault();
                          return;
                        }
                        console.log("Mobile touch end - student");
                        e.currentTarget.style.backgroundColor = '#ea580c';
                        if (!isLoading && !selectedRole) {
                          setTimeout(() => handleRoleSelection("student"), 10);
                        }
                      }}
                      style={{ 
                        WebkitTapHighlightColor: 'rgba(234, 88, 12, 0.5)',
                        WebkitUserSelect: 'none',
                        WebkitTouchCallout: 'none',
                        minHeight: '48px' // Minimum touch target size
                      }}
                    >
                      👩‍🎓 Uczniem
                    </div>
                    <div
                      className={`w-full py-4 px-4 sm:px-8 rounded-lg font-medium text-white text-base sm:text-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors flex items-center justify-center gap-2 cursor-pointer touch-manipulation select-none
                        ${(isLoading || loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration") ? "opacity-50 pointer-events-none" : ""}`}
                      onClick={() => {
                        console.log("Mobile div click - teacher");
                        if (!isLoading && !selectedRole && loadingState !== "redirecting-to-stripe" && loadingState !== "creating-platform-subscription" && loadingState !== "completing-registration") {
                          handleRoleSelection("teacher");
                        }
                      }}
                      onTouchStart={(e) => {
                        if (loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration") {
                          e.preventDefault();
                          return;
                        }
                        console.log("Mobile touch start - teacher");
                        e.currentTarget.style.backgroundColor = '#1d4ed8';
                      }}
                      onTouchEnd={(e) => {
                        if (loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration") {
                          e.preventDefault();
                          return;
                        }
                        console.log("Mobile touch end - teacher");
                        e.currentTarget.style.backgroundColor = '#1d4ed8';
                        if (!isLoading && !selectedRole) {
                          setTimeout(() => handleRoleSelection("teacher"), 10);
                        }
                      }}
                      style={{ 
                        WebkitTapHighlightColor: 'rgba(29, 78, 216, 0.5)',
                        WebkitUserSelect: 'none',
                        WebkitTouchCallout: 'none',
                        minHeight: '48px' // Minimum touch target size
                      }}
                    >
                      👨‍🏫 Nauczycielem
                    </div>
                  </>
                ) : (
                  // Desktop buttons
                  <>
                    <button
                      type="button"
                      className={`w-full py-3 px-4 sm:px-8 rounded-lg font-medium text-white text-base sm:text-lg bg-orange-600 hover:bg-orange-700 active:bg-orange-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation select-none cursor-pointer
                        ${(loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration") ? "pointer-events-none opacity-50" : ""}`}
                      {...createTouchHandler("student")}
                      disabled={isLoading || (loadingState === "redirecting-to-stripe") || (loadingState === "creating-platform-subscription") || (loadingState === "completing-registration")}
                      role="button"
                      tabIndex={0}
                      style={{ 
                        WebkitTapHighlightColor: 'transparent',
                        WebkitUserSelect: 'none',
                        WebkitTouchCallout: 'none'
                      }}
                    >
                      👩‍🎓 Uczniem
                    </button>
                    <button
                      type="button"
                      className={`w-full py-3 px-4 sm:px-8 rounded-lg font-medium text-white text-base sm:text-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation select-none cursor-pointer
                        ${(loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration") ? "pointer-events-none opacity-50" : ""}`}
                      {...createTouchHandler("teacher")}
                      disabled={isLoading || (loadingState === "redirecting-to-stripe") || (loadingState === "creating-platform-subscription") || (loadingState === "completing-registration")}
                      role="button"
                      tabIndex={0}
                      style={{ 
                        WebkitTapHighlightColor: 'transparent',
                        WebkitUserSelect: 'none',
                        WebkitTouchCallout: 'none'
                      }}
                    >
                      👨‍🏫 Nauczycielem
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : currentStep === "business-type-selection" ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="flex items-center gap-2 text-base sm:text-lg font-semibold text-blue-600">
                  👨‍🏫 Typ działalności
                </span>
                <button
                  onClick={handleBackToRoleSelection}
                  className={`text-xs sm:text-sm text-gray-500 hover:text-gray-700 transition-colors ${(isLoading || loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration") ? "pointer-events-none opacity-50" : ""}`}
                  disabled={isLoading || loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration"}
                >
                  ← Zmień rolę
                </button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-sm sm:text-md font-semibold text-gray-700">Wybierz typ swojej działalności:</h3>
                
                <div className="space-y-2 sm:space-y-3">
                  <label className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 md:p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="businessType"
                      value="individual"
                      checked={businessData.businessType === "individual"}
                      onChange={(e) => {
                        if (loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration") return;
                        setBusinessData(prev => ({ 
                          ...prev, 
                          businessType: e.target.value as "individual" | "company",
                          schoolName: "",
                          companyName: "",
                          taxId: "",
                          requiresVatInvoices: false
                        }))
                      }}
                      className="mt-1 flex-shrink-0"
                      disabled={isLoading || loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration"}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-700 text-sm sm:text-base">🧑‍💼 Indywidualny nauczyciel</div>
                      <div className="text-xs sm:text-sm text-gray-600 mt-1 leading-tight">
                        Osoba fizyczna lub JDG - możesz wybrać czy chcesz wystawiać faktury VAT
                      </div>
                    </div>
                  </label>

                  {businessData.businessType === "individual" && (
                    <div className="ml-8 sm:ml-10 mt-2 space-y-3 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-800 text-sm sm:text-base">Dodatkowe opcje:</h4>
                      
                      <label className="flex items-start space-x-2 sm:space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={businessData.requiresVatInvoices || false}
                          onChange={(e) => {
                            if (loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration") return;
                            setBusinessData(prev => ({ 
                              ...prev, 
                              requiresVatInvoices: e.target.checked,
                              taxId: e.target.checked ? prev.taxId : "" // Wyczyść NIP gdy odznaczono
                            }))
                          }}
                          className="mt-1 flex-shrink-0"
                          disabled={isLoading || loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration"}
                        />
                        <div className="text-xs sm:text-sm">
                          <div className="font-medium text-gray-700">Prowadzę JDG i chcę wystawiać faktury VAT</div>
                          <div className="text-gray-600">Zaznacz, jeśli prowadzisz jednoosobową działalność gospodarczą i chcesz wystawiać faktury VAT uczniom</div>
                        </div>
                      </label>

                      {businessData.requiresVatInvoices && (
                        <div className="mt-3">
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                            NIP * (wymagany dla JDG)
                          </label>
                          <input
                            type="text"
                            value={businessData.taxId || ""}
                            onChange={(e) => {
                              if (loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration") return;
                              setBusinessData(prev => ({ ...prev, taxId: e.target.value }))
                            }}
                            className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="np. 1234567890"
                            disabled={isLoading || loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration"}
                            required
                          />
                          <p className="text-xs text-gray-600 mt-1">
                            NIP jest wymagany do wystawiania faktur VAT. W Stripe będzie użyty jako VAT ID w formacie &quot;PL&quot; + NIP
                          </p>
                        </div>
                      )}


                    </div>
                  )}

                  <label className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 md:p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="businessType"
                      value="company"
                      checked={businessData.businessType === "company"}
                      onChange={(e) => {
                        if (loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration") return;
                        setBusinessData(prev => ({ 
                          ...prev, 
                          businessType: e.target.value as "individual" | "company",
                          requiresVatInvoices: true // Szkoły domyślnie wystawiają faktury VAT (mają NIP)
                        }))
                      }}
                      className="mt-1 flex-shrink-0"
                      disabled={isLoading || loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration"}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-700 text-sm sm:text-base">🏢 Tryb Organizacji (nowa szkoła/placówka)</div>
                      <div className="text-xs sm:text-sm text-gray-600 mt-1 leading-tight">
                        Sp. z o.o., fundacja, stowarzyszenie - wymaga dokumentów firmy w Stripe
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 md:p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="businessType"
                      value="join-school"
                      checked={businessData.businessType === "join-school"}
                      onChange={(e) => {
                        if (loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration") return;
                        setBusinessData(prev => ({ 
                          ...prev, 
                          businessType: "join-school",
                          schoolName: "",
                          companyName: "",
                          taxId: "",
                          requiresVatInvoices: false
                        }))
                      }}
                      className="mt-1 flex-shrink-0"
                      disabled={isLoading || loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration"}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-700 text-sm sm:text-base">🔗 Dołącz do szkoły</div>
                      <div className="text-xs sm:text-sm text-gray-600 mt-1 leading-tight">
                        Chcesz pracować w istniejącej szkole - szkoła opłaca dostęp dla wszystkich nauczycieli
                      </div>
                    </div>
                  </label>
                </div>

                {businessData.businessType === "company" && (
                  <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-800 text-sm sm:text-base">Dane firmy:</h4>
                    
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Nazwa szkoły/placówki *
                      </label>
                      <input
                        type="text"
                        value={businessData.schoolName || ""}
                        onChange={(e) => {
                          if (loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration") return;
                          setBusinessData(prev => ({ ...prev, schoolName: e.target.value }))
                        }}
                        className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="np. Szkoła Podstawowa nr 1"
                        disabled={isLoading || loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration"}
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Nazwa firmy *
                      </label>
                      <input
                        type="text"
                        value={businessData.companyName || ""}
                        onChange={(e) => {
                          if (loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration") return;
                          setBusinessData(prev => ({ ...prev, companyName: e.target.value }))
                        }}
                        className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="np. Przykładowa Sp. z o.o."
                        disabled={isLoading || loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration"}
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        NIP *
                      </label>
                      <input
                        type="text"
                        value={businessData.taxId || ""}
                        onChange={(e) => {
                          if (loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration") return;
                          setBusinessData(prev => ({ ...prev, taxId: e.target.value }))
                        }}
                        className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="np. 1234567890"
                        disabled={isLoading || loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration"}
                      />
                    </div>

                    <label className="flex items-start space-x-2 sm:space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={businessData.requiresVatInvoices || false}
                        onChange={(e) => {
                          if (loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration") return;
                          setBusinessData(prev => ({ ...prev, requiresVatInvoices: e.target.checked }))
                        }}
                        className="mt-1 flex-shrink-0"
                        disabled={true} // Zawsze disabled - szkoły z NIP zawsze wystawiają faktury
                      />
                      <div className="text-xs sm:text-sm">
                        <div className="font-medium text-gray-700">Wymagam wystawiania faktur VAT ✓</div>
                        <div className="text-gray-600">Szkoły z NIP automatycznie wystawiają faktury VAT uczniom</div>
                      </div>
                    </label>
                  </div>
                )}

                <button
                  onClick={handleBusinessTypeSelection}
                  disabled={isLoading || (businessData.businessType === "company" && (!businessData.schoolName || !businessData.companyName || !businessData.taxId)) || (businessData.businessType === "individual" && businessData.requiresVatInvoices && !businessData.taxId) || loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration"}
                  className={`w-full py-3 px-3 sm:px-4 md:px-8 rounded-lg font-medium text-white text-sm sm:text-base lg:text-lg transition-all
                    ${isLoading || (businessData.businessType === "company" && (!businessData.schoolName || !businessData.companyName || !businessData.taxId)) || (businessData.businessType === "individual" && businessData.requiresVatInvoices && !businessData.taxId) || loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration"
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg"
                    }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="animate-spin" size={18} />
                      <span className="text-sm">Zapisywanie...</span>
                    </div>
                  ) : (
                    "Kontynuuj"
                  )}
                </button>
              </div>
            </div>
          ) : currentStep === "school-choice" ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="flex items-center gap-2 text-base sm:text-lg font-semibold text-blue-600">
                  🏫 Wybierz opcję szkoły
                </span>
                <button
                  onClick={handleBackToBusinessType}
                  className={`text-xs sm:text-sm text-gray-500 hover:text-gray-700 transition-colors ${(isLoading || loadingState === "redirecting-to-stripe") ? "pointer-events-none opacity-50" : ""}`}
                  disabled={isLoading}
                >
                  ← Wróć
                </button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-sm sm:text-md font-semibold text-gray-700">Co chcesz zrobić?</h3>
                
                <div className="grid gap-3 sm:gap-4">
                  <button
                    onClick={() => handleSchoolChoice("own-school")}
                    disabled={schoolsLoading || isLoading}
                    className={`w-full p-4 sm:p-6 border-2 rounded-lg transition-all text-left hover:shadow-lg
                      ${businessData.joinSchoolMode === "own-school"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                      }`}
                  >
                    <div className="font-semibold text-gray-800 mb-2">📘 Założę własną szkołę</div>
                    <div className="text-sm text-gray-600">
                      Będę rejestrow Stripe i płacić za platformę. Będę mógł zapraszać nauczycieli do mojej szkoły.
                    </div>
                  </button>

                  <button
                    onClick={() => handleSchoolChoice("join-existing-school")}
                    disabled={schoolsLoading || isLoading}
                    className={`w-full p-4 sm:p-6 border-2 rounded-lg transition-all text-left hover:shadow-lg
                      ${businessData.joinSchoolMode === "join-existing-school"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                      }`}
                  >
                    <div className="font-semibold text-gray-800 mb-2">👥 Dołączę do istniejącej szkoły</div>
                    <div className="text-sm text-gray-600">
                      Szkoła zajmuje się rejestracją Stripe i płatnościami. Ja skupiam się na nauczaniu.
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ) : currentStep === "find-school" ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="flex items-center gap-2 text-base sm:text-lg font-semibold text-blue-600">
                  🔍 Znajdź szkołę
                </span>
                <button
                  onClick={() => setCurrentStep("school-choice")}
                  className={`text-xs sm:text-sm text-gray-500 hover:text-gray-700 transition-colors ${(isLoading || schoolsLoading) ? "pointer-events-none opacity-50" : ""}`}
                  disabled={isLoading || schoolsLoading}
                >
                  ← Wróć
                </button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {schoolsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin" size={24} />
                    <span className="ml-2 text-gray-600">Ładowanie list szkoł...</span>
                  </div>
                ) : schools.length === 0 ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-700">
                      Brak dostępnych szkół. Spróbuj założyć własną szkołę.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Wyszukaj szkołę po nazwie..."
                        value={schoolSearchTerm}
                        onChange={(e) => setSchoolSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <span className="absolute right-3 top-2.5 text-gray-400">🔎</span>
                    </div>
                    {schoolSearchTerm && (
                      <>
                        <p className="text-sm text-gray-600">Wybierz szkołę, do której chcesz dołączyć:</p>
                        <div className="grid gap-3 max-h-96 overflow-y-auto">
                          {schools
                            .filter((school) =>
                              school.name.toLowerCase().includes(schoolSearchTerm.toLowerCase()) ||
                              school.companyName.toLowerCase().includes(schoolSearchTerm.toLowerCase()) ||
                              (school.description?.toLowerCase().includes(schoolSearchTerm.toLowerCase()) ?? false)
                            )
                            .map((school) => (
                            <div
                              key={school.id}
                              onClick={() => setSelectedSchoolId(school.id)}
                              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                selectedSchoolId === school.id
                                  ? "border-blue-500 bg-blue-50 shadow-md"
                                  : "hover:shadow-md border-gray-200"
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="font-semibold text-gray-800">{school.name}</h4>
                                  <p className="text-sm text-gray-600">{school.companyName}</p>
                                </div>
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                  {school._count.members} nauczycieli
                                </span>
                              </div>
                              {school.description && (
                                <p className="text-sm text-gray-600 mb-3">{school.description}</p>
                              )}
                            </div>
                          ))}
                          {schools.filter((school) =>
                            school.name.toLowerCase().includes(schoolSearchTerm.toLowerCase()) ||
                            school.companyName.toLowerCase().includes(schoolSearchTerm.toLowerCase()) ||
                            (school.description?.toLowerCase().includes(schoolSearchTerm.toLowerCase()) ?? false)
                          ).length === 0 && (
                            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                              <p className="text-sm text-gray-600">
                                Nie znaleziono szkoły zawierającej &quot;{schoolSearchTerm}&quot;.
                              </p>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                    {selectedSchoolId && (
                      <div className="space-y-3">
                        {schools.find(s => s.id === selectedSchoolId) && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs text-blue-600 font-medium mb-1">✓ Wybrana szkoła:</p>
                            <p className="text-sm font-semibold text-blue-900">{schools.find(s => s.id === selectedSchoolId)?.name}</p>
                          </div>
                        )}
                        <button
                          onClick={() => handleJoinSchool(selectedSchoolId)}
                          disabled={isLoading}
                          className="w-full py-2 px-4 text-sm font-semibold rounded transition-colors bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Wybierz tę szkołę i przejdź dalej
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : currentStep === "stripe-setup" ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="flex items-center gap-2 text-base sm:text-lg font-semibold text-blue-600">
                  💳 Konfiguracja płatności Stripe
                </span>
              </div>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">Konfiguracja konta płatności</h3>
                  <p className="text-sm text-blue-700 mb-3">
                    Aby sprzedawać kursy na platformie, potrzebujesz skonfigurowanego konta płatności Stripe Connect. 
                    Proces obejmuje:
                  </p>
                  <ul className="text-sm text-blue-700 space-y-1 ml-4">
                    <li>• Weryfikację tożsamości i danych biznesowych</li>
                    <li>• Podanie danych bankowych do wypłat</li>
                    <li>• Akceptację regulaminu Stripe Connect</li>
                    <li>• Ustawienie metod płatności</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Wymagane informacje</h4>
                  <p className="text-sm text-yellow-700 mb-2">
                    Przygotuj następujące dane przed kontynuowaniem:
                  </p>
                  <ul className="text-sm text-yellow-700 space-y-1 ml-4">
                    <li>• Dowód osobisty lub paszport</li>
                    <li>• Numer rachunku bankowego</li>
                    <li>• {businessData.businessType === "company" ? "Dane firmy (NIP, REGON, adres)" : "Adres zamieszkania"}</li>
                    <li>• Numer telefonu</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <label className="flex items-start space-x-3 cursor-pointer p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={businessData.acceptStripeTerms || false}
                      onChange={(e) => setBusinessData(prev => ({ ...prev, acceptStripeTerms: e.target.checked }))}
                      className="mt-1 flex-shrink-0"
                      disabled={isLoading}
                    />
                    <div className="text-sm">
                      <div className="font-medium text-gray-700">
                        Akceptuję <a href="https://stripe.com/connect-account/legal" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Regulamin Stripe Connect</a>
                      </div>
                      <div className="text-gray-600 mt-1">
                        Wymagane do przetwarzania płatności jako sprzedawca
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3 cursor-pointer p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={businessData.acceptDataProcessing || false}
                      onChange={(e) => setBusinessData(prev => ({ ...prev, acceptDataProcessing: e.target.checked }))}
                      className="mt-1 flex-shrink-0"
                      disabled={isLoading}
                    />
                    <div className="text-sm">
                      <div className="font-medium text-gray-700">
                        Wyrażam zgodę na przetwarzanie danych przez Stripe
                      </div>
                      <div className="text-gray-600 mt-1">
                        Stripe będzie przetwarzać dane w celu obsługi płatności zgodnie z <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Polityką Prywatności</a>
                      </div>
                    </div>
                  </label>
                </div>

                <button
                  onClick={() => {
                    if (!businessData.acceptStripeTerms || !businessData.acceptDataProcessing) {
                      toast.error("Musisz zaakceptować wszystkie wymagane zgody");
                      return;
                    }
                    handleStripeSetup();
                  }}
                  disabled={isLoading || !businessData.acceptStripeTerms || !businessData.acceptDataProcessing}
                  className={`w-full py-3 px-4 rounded-lg font-medium text-white text-sm sm:text-base lg:text-lg transition-all
                    ${isLoading || !businessData.acceptStripeTerms || !businessData.acceptDataProcessing
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg"
                    }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="animate-spin" size={18} />
                      <span className="text-sm">Konfigurowanie konta...</span>
                    </div>
                  ) : (
                    "Przejdź do konfiguracji Stripe"
                  )}
                </button>

                <button
                  onClick={() => {
                    setCurrentStep("platform-subscription");
                    toast("Pamiętaj: Konto Stripe jest wymagane do przyjmowania płatności od uczniów. Skonfiguruj je później w ustawieniach.", {
                      icon: "ℹ️",
                      duration: 5000
                    });
                  }}
                  disabled={isLoading}
                  className="w-full py-2 px-4 rounded-lg font-medium text-gray-600 text-sm border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Przejdź do wyboru planu (Stripe można skonfigurować później)
                </button>
              </div>
            </div>
          ) : currentStep === "platform-subscription" ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="flex items-center gap-2 text-base sm:text-lg font-semibold text-blue-600">
                  💳 Subskrypcja platformy
                </span>
              </div>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800 font-medium flex items-center gap-2">
                    ℹ️ <span>Wymagane: Konto Stripe + Subskrypcja platformy</span>
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Aby prowadzić kursy, musisz mieć zarówno skonfigurowane konto Stripe (do przyjmowania płatności od uczniów), jak i aktywną subskrypcję platformy.
                  </p>
                </div>
                
                {businessData.joinSchoolMode === "join-existing-school" ? (
                  // User is joining existing school - no subscription needed
                  <div className="text-center space-y-4">
                    <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6">
                      <p className="text-lg font-semibold text-green-800 mb-2">✅ Dołączasz do istniejącej szkoły</p>
                      <p className="text-sm text-green-700">
                        Subskrypcję platformy opłaca właściciel szkoły. Ty masz automatycznie dostęp do wszystkich funkcji!
                      </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-700">
                        <strong>Co dalej?</strong><br/>
                        Twoja prośba o dołączenie została wysłana do właściciela szkoły. Po zatwierdzeniu będziesz mieć pełny dostęp do platformy.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        if (loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration") {
                          return;
                        }
                        
                        setIsLoading(true);
                        setLoadingState("completing-registration");
                        setCurrentStep("completed");
                        toast.success("Rejestracja zakończona! Czekaj na zatwierdzenie przez właściciela szkoły.", {
                          duration: 6000
                        });
                        
                        setTimeout(() => {
                          router.push("/teacher/courses");
                        }, 2000);
                      }}
                      disabled={isLoading || loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration"}
                      className={`w-full py-3 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${(loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration") ? "pointer-events-none" : ""}`}
                    >
                      Ukończ rejestrację
                    </button>
                  </div>
                ) : (currentSchoolType === "individual" && (businessData.joinSchoolMode === "own-school" || businessData.joinSchoolMode === undefined)) ? (
                  // Show only Individual Plan (for individual teachers not owning a school)
                  <div>
                    <h3 className="text-md font-semibold text-gray-700 mb-3">Twój plan dostępu:</h3>
                    
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-4 mb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-800 text-lg">🧑‍💼 Plan Indywidualny</div>
                          <div className="text-sm text-gray-700 mt-1">
                            Idealny dla nauczycieli pracujących indywidualnie
                          </div>
                          <div className="text-xs text-gray-600 mt-2">
                            • Pełny dostęp do funkcji<br/>
                            • Tworzenie interaktywnych kursów<br/>
                            • Podstawowe wsparcie techniczne<br/>
                            • <span className="text-green-600 font-medium">Anulowanie w każdej chwili</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">39 zł</div>
                          <div className="text-sm text-gray-600">miesięcznie</div>
                          <div className="text-sm text-green-600 font-medium mt-2">30 dni GRATIS</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={() => handlePlatformSubscription("individual")}
                        disabled={isLoading || loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration"}
                        className={`w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${(loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration") ? "pointer-events-none" : ""}`}
                      >
                        Przejdź do płatności
                      </button>
                      
                      <button
                        onClick={() => {
                          if (loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration") {
                            return;
                          }
                          
                          setIsLoading(true);
                          setLoadingState("completing-registration");
                          setCurrentStep("completed");
                          toast("Rejestracja zakończona! Pamiętaj: Musisz aktywować subskrypcję, aby sprzedawać kursy.", {
                            icon: "ℹ️",
                            duration: 6000
                          });
                          
                          setTimeout(() => {
                            router.push("/teacher/courses");
                          }, 2000);
                        }}
                        disabled={isLoading || loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration"}
                        className={`w-full py-2 px-4 rounded-lg font-medium text-gray-600 text-sm border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 ${(loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration") ? "pointer-events-none" : ""}`}
                      >
                        Pomiń teraz (dokończę konfigurację później)
                      </button>
                    </div>
                  </div>
                ) : (currentSchoolType === "business" || businessData.joinSchoolMode === "own-school") ? (
                  // Show only School Plan (for business school type or "own-school" mode)
                  <div>
                    <h3 className="text-md font-semibold text-gray-700 mb-3">Twój plan dostępu:</h3>
                    
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-300 rounded-lg p-4 mb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-800 text-lg">🏫 Tryb Organizacji</div>
                          <div className="text-sm text-gray-700 mt-1">
                            Dla szkół/organizacji: gdy masz &gt; 50 aktywnych uczniów lub dodajesz drugiego nauczyciela
                          </div>
                          <div className="text-xs text-gray-600 mt-2">
                            • Wszystkie funkcjonalności<br/>
                            • Nielimitowani członkowie zespołu<br/>
                            • Pełne wsparcie techniczne<br/>
                            • <span className="text-green-600 font-medium">Anulowanie w każdej chwili</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-purple-600">1499 zł</div>
                          <div className="text-sm text-gray-600">rocznie</div>
                          <div className="text-sm text-green-600 font-medium mt-2">30 dni GRATIS</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={() => handlePlatformSubscription("school")}
                        disabled={isLoading || loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration"}
                        className={`w-full py-3 px-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${(loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration") ? "pointer-events-none" : ""}`}
                      >
                        Przejdź do płatności
                      </button>
                      
                      <button
                        onClick={() => {
                          if (loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration") {
                            return;
                          }
                          
                          setIsLoading(true);
                          setLoadingState("completing-registration");
                          setCurrentStep("completed");
                          toast("Rejestracja zakończona! Pamiętaj: Musisz aktywować subskrypcję, aby sprzedawać kursy.", {
                            icon: "ℹ️",
                            duration: 6000
                          });
                          
                          setTimeout(() => {
                            router.push("/teacher/courses");
                          }, 2000);
                        }}
                        disabled={isLoading || loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration"}
                        className={`w-full py-2 px-4 rounded-lg font-medium text-gray-600 text-sm border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 ${(loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration") ? "pointer-events-none" : ""}`}
                      >
                        Pomiń teraz (dokończę konfigurację później)
                      </button>
                    </div>
                  </div>
                ) : (
                  // Debug: Show what's happening
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 font-bold">⚠️ Debug: Żaden plan nie pasuje do warunków</p>
                    <p className="text-sm text-red-600 mt-2">currentSchoolType: {currentSchoolType}</p>
                    <p className="text-sm text-red-600">joinSchoolMode: {businessData.joinSchoolMode}</p>
                    <p className="text-sm text-red-600">businessType: {businessData.businessType}</p>
                  </div>
                )}
                
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-700">
                    ℹ️ <strong>Okres próbny:</strong> Plan zawiera 30-dniowy bezpłatny okres próbny.
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    🔄 <strong>Elastyczność:</strong> Anuluj lub zmień plan w każdej chwili bez opłat za rezygnację.
                  </p>
                </div>

                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-700">
                    ⚠️ <strong>Ważne:</strong> Subskrypcja platformy jest wymagana, aby móc publikować i sprzedawać kursy.
                  </p>
                </div>
              </div>
            </div>
          ) : currentStep === "completed" ? (
            <div className="text-center space-y-4">
              <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6">
                <p className="text-lg font-semibold text-green-800 mb-2">✅ Wszystkie kroki zostały wykonane</p>
                <p className="text-sm text-green-700">
                  Rejestracja zakończona. Kliknij przycisk poniżej, aby przejść do platformy.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration") {
                    return;
                  }
                  router.push(selectedRole === "teacher" ? "/teacher/courses" : "/");
                }}
                disabled={isLoading || loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration"}
                className={`w-full py-3 px-4 rounded-lg font-medium text-white text-sm sm:text-base lg:text-lg transition-all
                  ${isLoading || loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration"
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 hover:shadow-lg"
                  }`}
              >
                Przejdź do platformy
              </button>
            </div>
          ) : currentStep === "terms-consent" ? (
            <div>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <span className={`flex items-center gap-1 sm:gap-2 text-sm sm:text-base lg:text-lg font-semibold ${selectedRole === "student" ? "text-orange-600" : "text-blue-600"}`}>
                  {selectedRole === "student" ? "👩‍🎓 Regulamin ucznia" : "👨‍🏫 Regulamin nauczyciela"}
                </span>
                <button
                  className={`text-xs sm:text-sm text-gray-500 underline hover:text-orange-700 transition disabled:opacity-50 px-1 py-1 ${(isLoading || loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration") ? "pointer-events-none opacity-50" : ""}`}
                  onClick={handleBackToRoleSelection}
                  type="button"
                  disabled={isLoading || loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration"}
                >
                  ← Zmień rolę
                </button>
              </div>

              {selectedRole === "student" ? STUDENT_TERMS : TEACHER_TERMS}

              <label className="flex items-start mt-2 sm:mt-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={e => {
                    if (loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration") {
                      e.preventDefault();
                      return;
                    }
                    setAcceptTerms(e.target.checked);
                    if (e.target.checked && registrationError) {
                      setRegistrationError(null);
                    }
                  }}
                  disabled={isLoading || loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration"}
                  className={`form-checkbox h-4 w-4 mt-0.5 flex-shrink-0 ${selectedRole === "student" ? "accent-orange-500" : "accent-blue-500"} disabled:opacity-50`}
                />
                <span className={`ml-2 text-xs sm:text-sm leading-tight ${isLoading ? "text-gray-400" : "text-gray-700"}`}>
                  Akceptuję
                  <Link href="/terms" className="ml-1 underline hover:text-orange-600">Regulamin</Link>
                  <span className="mx-1">oraz</span>
                  <Link href="/privacy" className="underline hover:text-orange-600">Politykę Prywatności</Link>
                </span>
              </label>

              <button
                type="button"
                onClick={() => {
                  if (!acceptTerms) {
                    setRegistrationError("Aby kontynuować, musisz zaakceptować regulamin");
                    toast.error("Aby kontynuować, musisz zaakceptować regulamin.");
                    return;
                  }
                  setRegistrationError(null);
                  setCurrentStep(selectedRole === "teacher" ? "business-type-selection" : "terms-acceptance");
                }}
                disabled={isLoading || !acceptTerms || loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration"}
                className={`w-full mt-3 sm:mt-4 py-3 px-3 sm:px-4 md:px-8 rounded-lg font-medium text-white text-sm sm:text-base lg:text-lg transition-all
                  ${selectedRole === "student"
                    ? (isLoading || !acceptTerms || loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration"
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-orange-600 hover:bg-orange-700 hover:shadow-lg")
                    : (isLoading || !acceptTerms || loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration"
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg")
                  }`}
              >
                Kontynuuj
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <span className={`flex items-center gap-1 sm:gap-2 text-sm sm:text-base lg:text-lg font-semibold ${selectedRole === "student" ? "text-orange-600" : "text-blue-600"}`}>
                  {selectedRole === "student" ? "👩‍🎓 Rejestracja ucznia" : "👨‍🏫 Rejestracja nauczyciela"}
                </span>
                <button
                  className={`text-xs sm:text-sm text-gray-500 underline hover:text-orange-700 transition disabled:opacity-50 px-1 py-1 ${(isLoading || loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration") ? "pointer-events-none opacity-50" : ""}`}
                  onClick={selectedRole === "teacher" ? handleBackToBusinessType : handleBackToTermsConsent}
                  type="button"
                  disabled={isLoading || loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration"}
                >
                  {selectedRole === "teacher" ? "← Wróć" : "← Wróć"}
                </button>
              </div>
              <div className={`p-3 sm:p-4 rounded-lg border ${selectedRole === "student" ? "bg-orange-50 border-orange-200" : "bg-blue-50 border-blue-200"}`}>
                <p className={`text-sm font-semibold ${selectedRole === "student" ? "text-orange-800" : "text-blue-800"}`}>
                  {selectedRole === "teacher" ? "✅ Konto zostało utworzone" : "✅ Wszystkie kroki zostały wykonane"}
                </p>
                <p className={`text-xs sm:text-sm mt-1 leading-tight ${selectedRole === "student" ? "text-orange-700" : "text-blue-700"}`}>
                  {selectedRole === "teacher"
                    ? (businessData.joinSchoolMode === "join-existing-school"
                        ? "Możesz przejść do platformy. Szkoła zajmuje się płatnościami."
                        : "Możesz kontynuować. Pozostała konfiguracja płatności (Stripe).")
                    : "Rejestracja zakończona. Kliknij przycisk poniżej, aby przejść do platformy."}
                </p>
              </div>
              
              {selectedRole === "teacher" && (
                <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs sm:text-sm text-blue-700 font-medium">ℹ️ Następny krok:</p>
                  {businessData.joinSchoolMode === "join-existing-school" ? (
                    <p className="text-xs text-blue-600 mt-1 leading-tight">
                      Po kliknięciu &quot;Przejdź do platformy&quot; zostaniesz zalogowany. Szkoła zajmuje się wszystkimi płatnościami.
                    </p>
                  ) : (
                    <p className="text-xs text-blue-600 mt-1 leading-tight">
                      Po kliknięciu &quot;Kontynuuj&quot; rozpoczniesz konfigurację konta płatności w Stripe.
                    </p>
                  )}
                </div>
              )}
              
              <button
                onClick={handleSignUp}
                disabled={isLoading || !isSignedIn || !acceptTerms || loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration"}
                className={`w-full mt-3 sm:mt-4 py-3 px-3 sm:px-4 md:px-8 rounded-lg font-medium text-white text-sm sm:text-base lg:text-lg transition-all
                  ${selectedRole === "student"
                    ? (isLoading || !isSignedIn || !acceptTerms || loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration"
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-orange-600 hover:bg-orange-700 hover:shadow-lg")
                    : (isLoading || !isSignedIn || !acceptTerms || loadingState === "redirecting-to-stripe" || loadingState === "creating-platform-subscription" || loadingState === "completing-registration"
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg")
                  }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="animate-spin" size={18} />
                    <span className="text-sm">
                      {loadingState === "creating-user" && "Tworzenie konta..."}
                      {loadingState === "creating-stripe-account" && "Konfiguracja płatności..."}
                      {loadingState === "updating-user" && "Aktualizacja danych..."}
                      {loadingState === "redirecting-to-stripe" && "Przekierowywanie..."}
                      {loadingState === "idle" && "Przetwarzanie..."}
                    </span>
                  </div>
                ) : selectedRole === "student" ? (
                  "Przejdź do platformy"
                ) : businessData.joinSchoolMode === "join-existing-school" ? (
                  "Przejdź do platformy"
                ) : (
                  "Kontynuuj (następny krok: konfiguracja płatności)"
                )}
              </button>
            </div>
          )}
        </div>
        {!isSignedIn && (
          <p className="text-sm text-amber-600">
            Proszę najpierw się zalogować, aby zakończyć rejestrację
          </p>
        )}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-gray-500">
          <Link href="/terms" className="underline hover:text-orange-600">Regulamin</Link>
          <span className="text-gray-300">•</span>
          <Link href="/privacy" className="underline hover:text-orange-600">Polityka Prywatności</Link>
        </div>
        </div>
      </div>
    </>
  );
}
