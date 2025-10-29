"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const TERMS_EFFECTIVE_DATE = "18.10.2025";
const TERMS_LAST_UPDATE = "18.10.2025";

const STUDENT_TERMS = (
  <div className="text-left max-h-40 sm:max-h-48 md:max-h-64 overflow-y-auto px-2 sm:px-3 py-2 sm:py-3 bg-orange-50 rounded-lg border border-orange-200 shadow-inner text-xs sm:text-sm leading-relaxed space-y-1 sm:space-y-2">
    <h2 className="text-sm sm:text-lg font-bold text-orange-700 mb-1 sm:mb-2 sticky top-0 bg-orange-50 py-1">📜 Warunki uczestnictwa użytkownika w platformie Ecurs</h2>
    <p className="text-xs text-gray-500 mb-1 sm:mb-2 sticky top-8 sm:top-10 bg-orange-50 py-1">
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
      <li>Płatność za kurs może być jednorazowa lub w formie subskrypcji, w zależności od opcji wybranej przez nauczyciela.</li>
      <li><b>Anulowanie subskrypcji:</b> W przypadku subskrypcji, uczeń może anulować subskrypcję w dowolnym momencie przez panel ustawień. Anulowanie jest skuteczne na koniec bieżącego okresu rozliczeniowego - do tego czasu uczeń zachowuje dostęp do zakupionych materiałów.</li>
      <li>Zwroty i reklamacje są rozpatrywane indywidualnie zgodnie z polityką platformy.</li>
      <li><b>Umowa sprzedaży kursu zawierana jest bezpośrednio między uczniem a nauczycielem.</b> Platforma Ecurs pełni wyłącznie rolę pośrednika technicznego umożliwiającego zawarcie umowy.</li>
      <li><b>Płatności za kursy trafiają bezpośrednio na konto nauczyciela.</b> Platforma nie jest stroną umowy sprzedaży i nie ponosi odpowiedzialności za jej wykonanie.</li>
    </ul>
    <p className="font-semibold text-gray-700 mt-2">§6. Odpowiedzialność za treści kursów</p>
    <ul className="list-disc ml-6 text-gray-700">
      <li><b>Wyłączna odpowiedzialność nauczyciela:</b> Za merytoryczną treść kursów, ich jakość, poprawność oraz zgodność z prawem odpowiada wyłącznie nauczyciel prowadzący kurs.</li>
      <li><b>Brak odpowiedzialności platformy:</b> Platforma Ecurs nie weryfikuje treści merytorycznej kursów i nie ponosi odpowiedzialności za ich zawartość, błędy, szkody wynikające z korzystania z kursów lub niezgodność z oczekiwaniami ucznia.</li>
      <li><b>Roszczenia uczniów:</b> Wszelkie roszczenia dotyczące treści kursów, ich jakości, zwrotów, odszkodowań lub innych roszczeń związanych z kursami uczniowie kierują bezpośrednio do nauczyciela. Platforma nie jest stroną tych sporów.</li>
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
    <h2 className="text-sm sm:text-lg font-bold text-blue-700 mb-1 sm:mb-2 sticky top-0 bg-blue-50 py-1">📜 Warunki uczestnictwa nauczyciela w platformie Ecurs</h2>
    <p className="text-xs text-gray-500 mb-1 sm:mb-2 sticky top-8 sm:top-10 bg-blue-50 py-1">
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
        <b>Proces rejestracji:</b> Po akceptacji regulaminu zostaniesz automatycznie przekierowany na bezpieczną stronę Stripe, gdzie podasz swoje dane do celów płatności i fiskalnych. Po zakończeniu procesu zostaniesz przekierowany z powrotem na platformę Ecurs.
      </li>
      <li>
        <b>Dane wymagane przez Stripe:</b> Imię i nazwisko, adres, numer telefonu, dane bankowe do otrzymywania płatności oraz informacje niezbędne do wystawiania faktur zgodnie z polskim prawem podatkowym.
      </li>
      <li>
        <b>Obowiązki fiskalne:</b> Nauczyciel jest odpowiedzialny za rozliczenie podatkowe otrzymanych płatności zgodnie z obowiązującym prawem. Platforma przekazuje dane o transakcjach niezbędne do rozliczeń podatkowych.
      </li>
      <li>
        <b>Bezpieczeństwo danych:</b> Wszystkie dane płatności są przetwarzane przez certyfikowany system Stripe zgodnie z najwyższymi standardami bezpieczeństwa (PCI DSS Level 1). Platforma Ecurs nie przechowuje wrażliwych danych płatności.
      </li>
    </ul>
    <p className="font-semibold text-gray-700 mt-2">§6. Warunki płatności, okresy rozliczeniowe i zmiana licencji</p>
    <ul className="list-disc ml-6 text-gray-700">
      <li>
        <b>Indywidualny twórca</b> – osoba fizyczna prowadząca kursy na platformie Ecurs, posiadająca nie więcej niż 10 aktywnych uczniów oraz jedno konto nauczyciela.
      </li>
      <li>
        <b>Szkoła lub placówka edukacyjna</b> – instytucja lub organizacja, która posiada więcej niż jednego nauczyciela (współtworzących kursy) lub więcej niż 10 aktywnych uczniów. Szkoła może tworzyć zespoły nauczycieli i zarządzać kursami wspólnie.
      </li>
      <li>
        Po zakończeniu okresu próbnego (3 miesiące) nauczyciel lub szkoła zobowiązani są do wyboru jednego z planów płatności:
        <ul className="list-disc ml-6 mt-2">
          <li>
            <b>Plan dla indywidualnych twórców prowadzących do 20 uczniów w zamkniętych kursach:</b> 39 zł za miesiąc – pełny dostęp do funkcji, tworzenie interaktywnych kursów, zarządzanie treściami i uczniami, podstawowe wsparcie techniczne.
          </li>
          <li>
            <b>Dla szkół i placówek edukacyjnych lub twórców posiadających więcej niż 20 uczniów w zamkniętych kursach:</b> 1499 zł za rok – pełny dostęp do wszystkich funkcjonalności, nielimitowani członkowie zespołu, pełne wsparcie techniczne.
          </li>
        </ul>
      </li>
      <li>
        <b>Mechanizm przejścia:</b> Jeśli liczba aktywnych uczniów w kursach zamkniętych przekroczy 20 osób lub do kursów zostanie przypisany drugi nauczyciel, użytkownik zostanie automatycznie poinformowany o konieczności przejścia na plan dla szkół. Informacja zostanie przekazana mailowo na adres podany przy rejestracji oraz poprzez komunikat w panelu platformy. Użytkownik ma 30 dni na przejście na wyższy plan.
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
    <p className="font-semibold text-gray-700 mt-2">§8. Ograniczenie odpowiedzialności platformy</p>
    <ul className="list-disc ml-6 text-gray-700">
      <li><b>Charakter usługi:</b> Platforma świadczy wyłącznie usługi techniczne umożliwiające publikację i sprzedaż kursów. Nie jest dostawcą treści edukacyjnych ani stroną umów zawieranych między nauczycielami a uczniami.</li>
      <li><b>Wyłączenie odpowiedzialności:</b> Platforma wyłącza swoją odpowiedzialność za jakość, poprawność, skuteczność kursów oraz wszelkie szkody wynikające z ich wykorzystania.</li>
      <li><b>Odpowiedzialność za płatności:</b> Platforma nie ponosi odpowiedzialności za nieprawidłowości w rozliczeniach podatkowych nauczycieli, opóźnienia płatności czy problemy z systemem Stripe.</li>
      <li><b>Siła wyższa:</b> Platforma nie ponosi odpowiedzialności za szkody wynikające z działania siły wyższej, awarii systemów, ataków hakerskich lub innych zdarzeń pozostających poza jej kontrolą.</li>
      <li><b>Maksymalna odpowiedzialność:</b> W przypadkach gdzie wyłączenie odpowiedzialności prawnie nie jest możliwe, odpowiedzialność platformy ograniczona jest do wysokości miesięcznej opłaty za licencję nauczyciela.</li>
    </ul>
    <p className="font-semibold text-gray-700 mt-2">§9. Zgodność z prawem i obowiązki fiskalne</p>
    <ul className="list-disc ml-6 text-gray-700">
      <li><b>Obowiązki podatkowe:</b> Nauczyciel ponosi pełną odpowiedzialność za prawidłowe rozliczenie podatkowe wszystkich otrzymanych płatności zgodnie z polskim prawem podatkowym.</li>
      <li><b>Działalność gospodarcza:</b> Nauczyciel zobowiązuje się do prowadzenia działalności zgodnie z obowiązującymi przepisami prawa, w tym dotyczącymi działalności gospodarczej, jeśli jest wymagana.</li>
      <li><b>Licencje i uprawnienia:</b> Nauczyciel zapewnia, że posiada wszystkie niezbędne licencje, uprawnienia i kwalifikacje do prowadzenia działalności edukacyjnej w zakresie oferowanych kursów.</li>
      <li><b>Prawa autorskie:</b> Nauczyciel gwarantuje, że posiada wszystkie prawa do wykorzystywanych w kursach materiałów lub posiada odpowiednie licencje na ich użycie.</li>
      <li><b>Odpowiedzialność karna:</b> Nauczyciel ponosi wyłączną odpowiedzialność karną za wszelkie czyny zabronione związane z prowadzoną działalnością edukacyjną.</li>
    </ul>
    <p className="font-semibold text-gray-700 mt-2">§10. Pliki cookies</p>
    <ul className="list-disc ml-6 text-gray-700">
      <li>
        Serwis wykorzystuje pliki cookies w celu zapewnienia prawidłowego działania, personalizacji treści oraz analizy ruchu. Korzystając z serwisu, użytkownik wyraża zgodę na używanie plików cookies zgodnie z Polityką Prywatności. Użytkownik może zmienić ustawienia dotyczące cookies w swojej przeglądarce internetowej.
      </li>
    </ul>
    <p className="font-semibold text-gray-700 mt-2">§11. Postanowienia końcowe</p>
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

type RegistrationStep = "role-selection" | "business-type-selection" | "terms-acceptance" | "user-creation" | "stripe-setup" | "platform-subscription" | "completed";
type LoadingState = "idle" | "creating-user" | "creating-stripe-account" | "redirecting-to-stripe" | "updating-user" | "creating-platform-subscription";

interface BusinessTypeData {
  businessType: "individual" | "company";
  companyName?: string;
  taxId?: string;
  requiresVatInvoices?: boolean;
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
    taxId: "",
    requiresVatInvoices: false
  });
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const router = useRouter();

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

  const getStepNumber = (step: RegistrationStep): number => {
    const stepMap = {
      "role-selection": 1,
      "business-type-selection": 2,
      "terms-acceptance": 3,
      "user-creation": 4,
      "stripe-setup": 5,
      "platform-subscription": 6,
      "completed": 7
    };
    return stepMap[step];
  };

  const getLoadingMessage = (state: LoadingState): string => {
    const messages = {
      "idle": "",
      "creating-user": "Tworzenie konta użytkownika...",
      "creating-stripe-account": "Przygotowywanie konta płatności...",
      "redirecting-to-stripe": "Przekierowywanie do Stripe...",
      "updating-user": "Aktualizowanie danych użytkownika...",
      "creating-platform-subscription": "Przygotowywanie subskrypcji platformy..."
    };
    return messages[state];
  };

  const ProgressIndicator = ({ currentStep, selectedRole }: { currentStep: RegistrationStep; selectedRole: "student" | "teacher" | null }) => {
    if (!selectedRole || currentStep === "role-selection") return null;
    
    const steps = selectedRole === "teacher" 
      ? ["Wybór roli", "Typ działalności", "Akceptacja regulaminu", "Tworzenie konta", "Konfiguracja płatności", "Subskrypcja platformy", "Zakończone"]
      : ["Wybór roli", "Akceptacja regulaminu", "Tworzenie konta", "Zakończone"];
    
    const currentStepNumber = getStepNumber(currentStep);
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

    setRegistrationError(null);
    const roleId = selectedRole === "student" ? 0 : 1;
    
    try {
      setIsLoading(true);
      setCurrentStep("user-creation");
      setLoadingState("creating-user");
      
      // Prepare request body with business data for teachers
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
      toast.success("Konto użytkownika utworzone pomyślnie!");
      
      if (selectedRole === "teacher" && result.needsStripeOnboarding) {
        setCurrentStep("stripe-setup");
        setLoadingState("creating-stripe-account");
        
        try {
          const stripeResponse = await fetch("/api/stripe/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
          
          if (!stripeResponse.ok) {
            let errorMessage = "Nie udało się utworzyć konta płatności";
            
            try {
              // Try to parse as JSON first
              const stripeError = await stripeResponse.json();
              errorMessage = stripeError.message || errorMessage;
            } catch (parseError) {
              // If JSON parsing fails, try to get text content
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
          
          // Redirect to Stripe onboarding regardless of whether account exists or not
          if (stripeResult.onboardingUrl) {
            setLoadingState("redirecting-to-stripe");
            toast.success("Przekierowujemy Cię do konfiguracji konta płatności...");
            
            // Add a small delay to show the message
            setTimeout(() => {
              window.location.href = stripeResult.onboardingUrl;
            }, 1500);
            return;
          } else {
            throw new Error("Nie otrzymano linku do konfiguracji konta płatności");
          }
          
        } catch (stripeError) {
          console.error("Błąd konfiguracji Stripe:", stripeError);
          
          const stripeErrorMessage = stripeError instanceof Error 
            ? stripeError.message 
            : "Błąd podczas konfiguracji konta płatności";
            
          setRegistrationError(`${stripeErrorMessage}. Możesz dokończyć konfigurację później w panelu nauczyciela.`);
          toast.error(stripeErrorMessage + ". Możesz to zrobić później w panelu nauczyciela.");
          
          // For teachers, skip to platform subscription step if Stripe fails
          setCurrentStep("platform-subscription");
        }
      } else {
        // Student registration completes here
        if (selectedRole === "student") {
          setCurrentStep("completed");
          toast.success("Rejestracja zakończona sukcesem!");
          
          setTimeout(() => {
            router.push("/");
            router.refresh();
          }, 1000);
        } else {
          // Teacher without Stripe onboarding goes to platform subscription
          setCurrentStep("platform-subscription");
        }
      }
      
    } catch (error) {
      console.error("Błąd rejestracji użytkownika:", error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Nie udało się zarejestrować";
        
      setRegistrationError(errorMessage);
      toast.error(errorMessage);
      setCurrentStep("terms-acceptance"); // Reset to previous step
    } finally {
      setIsLoading(false);
      setLoadingState("idle");
    }
  };

  const handlePlatformSubscription = async (subscriptionType: "individual" | "school") => {
    if (!selectedRole || selectedRole !== "teacher") return;
    
    try {
      setIsLoading(true);
      setLoadingState("creating-platform-subscription");
      
      const response = await fetch("/api/platform-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptionType: subscriptionType
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.sessionUrl) {
          toast.success("Przekierowujemy Cię do płatności za dostęp do platformy...");
          
          setTimeout(() => {
            window.location.href = result.sessionUrl;
          }, 1500);
        } else {
          throw new Error("Nie otrzymano linku do płatności");
        }
      } else {
        let errorMessage = "Błąd podczas tworzenia subskrypcji platformy";
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
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
      const errorMessage = error instanceof Error ? error.message : "Błąd subskrypcji platformy";
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

  const handleRoleSelection = useCallback((role: "student" | "teacher") => {
    console.log("Role selection clicked:", role); // Debug log for mobile testing
    
    // Prevent any concurrent selections
    if (isLoading || selectedRole) return;
    
    // Clear any pending touch timeout
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
    }
    
    setSelectedRole(role);
    if (role === "teacher") {
      setCurrentStep("business-type-selection");
    } else {
      setCurrentStep("terms-acceptance");
    }
    setAcceptTerms(false);
    setRegistrationError(null);
    setLoadingState("idle");
    
    // Provide immediate visual feedback
    toast.success(`Wybrano rolę: ${role === "student" ? "uczeń" : "nauczyciel"}`);
  }, [isLoading, selectedRole]);

  // Mobile-optimized touch handler
  const createTouchHandler = useCallback((role: "student" | "teacher") => {
    return {
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isLoading && !selectedRole) {
          handleRoleSelection(role);
        }
      },
      onTouchEnd: (e: React.TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isLoading && !selectedRole) {
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
  }, [isLoading, selectedRole, handleRoleSelection]);

  const handleBusinessTypeSelection = async () => {
    if (!isSignedIn) {
      setRegistrationError("Zaloguj się, aby kontynuować");
      return;
    }

    if (businessData.businessType === "company" && (!businessData.companyName || !businessData.taxId)) {
      setRegistrationError("Dla firmy wymagana jest nazwa firmy i NIP");
      return;
    }

    // No API call here - business data will be saved during user creation
    setCurrentStep("terms-acceptance");
    setRegistrationError(null);
  };

  const handleBackToBusinessType = () => {
    setCurrentStep("business-type-selection");
    setAcceptTerms(false);
    setRegistrationError(null);
  };

  const handleBackToRoleSelection = () => {
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
      `}</style>
      
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
                      className="w-full py-4 px-4 sm:px-8 rounded-lg font-medium text-white text-base sm:text-lg bg-orange-600 hover:bg-orange-700 active:bg-orange-800 transition-colors flex items-center justify-center gap-2 cursor-pointer touch-manipulation select-none"
                      onClick={() => {
                        console.log("Mobile div click - student");
                        if (!isLoading && !selectedRole) {
                          handleRoleSelection("student");
                        }
                      }}
                      onTouchStart={(e) => {
                        console.log("Mobile touch start - student");
                        e.currentTarget.style.backgroundColor = '#ea580c';
                      }}
                      onTouchEnd={(e) => {
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
                      className="w-full py-4 px-4 sm:px-8 rounded-lg font-medium text-white text-base sm:text-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors flex items-center justify-center gap-2 cursor-pointer touch-manipulation select-none"
                      onClick={() => {
                        console.log("Mobile div click - teacher");
                        if (!isLoading && !selectedRole) {
                          handleRoleSelection("teacher");
                        }
                      }}
                      onTouchStart={(e) => {
                        console.log("Mobile touch start - teacher");
                        e.currentTarget.style.backgroundColor = '#1d4ed8';
                      }}
                      onTouchEnd={(e) => {
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
                      className="w-full py-3 px-4 sm:px-8 rounded-lg font-medium text-white text-base sm:text-lg bg-orange-600 hover:bg-orange-700 active:bg-orange-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation select-none cursor-pointer"
                      {...createTouchHandler("student")}
                      disabled={isLoading}
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
                      className="w-full py-3 px-4 sm:px-8 rounded-lg font-medium text-white text-base sm:text-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation select-none cursor-pointer"
                      {...createTouchHandler("teacher")}
                      disabled={isLoading}
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
                  className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  disabled={isLoading}
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
                      onChange={(e) => setBusinessData(prev => ({ 
                        ...prev, 
                        businessType: e.target.value as "individual" | "company",
                        companyName: "",
                        taxId: "",
                        requiresVatInvoices: false
                      }))}
                      className="mt-1 flex-shrink-0"
                      disabled={isLoading}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-700 text-sm sm:text-base">🧑‍💼 Osoba fizyczna (JDG)</div>
                      <div className="text-xs sm:text-sm text-gray-600 mt-1 leading-tight">
                        Prowadzisz kursy jako osoba fizyczna prowadząca działalność gospodarczą
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 md:p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="businessType"
                      value="company"
                      checked={businessData.businessType === "company"}
                      onChange={(e) => setBusinessData(prev => ({ 
                        ...prev, 
                        businessType: e.target.value as "individual" | "company" 
                      }))}
                      className="mt-1 flex-shrink-0"
                      disabled={isLoading}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-700 text-sm sm:text-base">🏢 Firma (spółka)</div>
                      <div className="text-xs sm:text-sm text-gray-600 mt-1 leading-tight">
                        Prowadzisz kursy jako firma (sp. z o.o., S.A., itp.) - wymagane faktury VAT
                      </div>
                    </div>
                  </label>
                </div>

                {businessData.businessType === "company" && (
                  <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-800 text-sm sm:text-base">Dane firmy:</h4>
                    
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Nazwa firmy *
                      </label>
                      <input
                        type="text"
                        value={businessData.companyName || ""}
                        onChange={(e) => setBusinessData(prev => ({ ...prev, companyName: e.target.value }))}
                        className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="np. Przykładowa Sp. z o.o."
                        disabled={isLoading}
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        NIP *
                      </label>
                      <input
                        type="text"
                        value={businessData.taxId || ""}
                        onChange={(e) => setBusinessData(prev => ({ ...prev, taxId: e.target.value }))}
                        className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="np. 1234567890"
                        disabled={isLoading}
                      />
                    </div>

                    <label className="flex items-start space-x-2 sm:space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={businessData.requiresVatInvoices || false}
                        onChange={(e) => setBusinessData(prev => ({ ...prev, requiresVatInvoices: e.target.checked }))}
                        className="mt-1 flex-shrink-0"
                        disabled={isLoading}
                      />
                      <div className="text-xs sm:text-sm">
                        <div className="font-medium text-gray-700">Wymagam wystawiania faktur VAT</div>
                        <div className="text-gray-600">Będę wystawiać faktury VAT swoim uczniom</div>
                      </div>
                    </label>
                  </div>
                )}

                <button
                  onClick={handleBusinessTypeSelection}
                  disabled={isLoading || (businessData.businessType === "company" && (!businessData.companyName || !businessData.taxId))}
                  className={`w-full py-3 px-3 sm:px-4 md:px-8 rounded-lg font-medium text-white text-sm sm:text-base lg:text-lg transition-all
                    ${isLoading || (businessData.businessType === "company" && (!businessData.companyName || !businessData.taxId))
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
                    "Kontynuuj do akceptacji regulaminu"
                  )}
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
                <h3 className="text-md font-semibold text-gray-700">Wybierz plan dostępu do platformy:</h3>
                <p className="text-sm text-gray-600">
                  Wybierz plan, który najlepiej odpowiada Twoim potrzebom. Każdy plan zawiera 30-dniowy okres próbny.
                </p>
                
                <div className="space-y-3">
                  <button
                    onClick={() => handlePlatformSubscription("individual")}
                    disabled={isLoading}
                    className="w-full p-4 border-2 rounded-lg hover:bg-blue-50 transition-colors text-left disabled:opacity-50 border-blue-200 hover:border-blue-300"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-700 text-base">🧑‍💼 Plan Indywidualny</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Do 20 uczniów w zamkniętych kursach
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          • Pełny dostęp do funkcji<br/>
                          • Tworzenie interaktywnych kursów<br/>
                          • Podstawowe wsparcie techniczne
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">39 zł</div>
                        <div className="text-xs text-gray-500">miesięcznie</div>
                        <div className="text-xs text-green-600 mt-1">30 dni GRATIS</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handlePlatformSubscription("school")}
                    disabled={isLoading}
                    className="w-full p-4 border-2 rounded-lg hover:bg-blue-50 transition-colors text-left disabled:opacity-50 border-blue-200 hover:border-blue-300"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-700 text-base">🏫 Plan dla Szkół</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Powyżej 20 uczniów lub więcej niż 1 nauczyciel
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          • Wszystkie funkcjonalności<br/>
                          • Nielimitowani członkowie zespołu<br/>
                          • Pełne wsparcie techniczne
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">1499 zł</div>
                        <div className="text-xs text-gray-500">rocznie</div>
                        <div className="text-xs text-green-600 mt-1">30 dni GRATIS</div>
                      </div>
                    </div>
                  </button>
                </div>
                
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-700">
                    ℹ️ <strong>Okres próbny:</strong> Wszystkie plany zawierają 30-dniowy bezpłatny okres próbny. 
                    Możesz anulować subskrypcję w każdym momencie bez dodatkowych kosztów.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setCurrentStep("completed");
                    toast.success("Rejestracja zakończona! Możesz skonfigurować płatność później.");
                    setTimeout(() => {
                      router.push("/teacher/courses");
                    }, 2000);
                  }}
                  disabled={isLoading}
                  className="w-full py-2 px-4 rounded-lg font-medium text-gray-600 text-sm border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Pomiń teraz (można dodać później w ustawieniach)
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <span className={`flex items-center gap-1 sm:gap-2 text-sm sm:text-base lg:text-lg font-semibold ${selectedRole === "student" ? "text-orange-600" : "text-blue-600"}`}>
                  {selectedRole === "student" ? "👩‍🎓 Rejestracja ucznia" : "👨‍🏫 Rejestracja nauczyciela"}
                </span>
                <button
                  className="text-xs sm:text-sm text-gray-500 underline hover:text-orange-700 transition disabled:opacity-50 px-1 py-1"
                  onClick={selectedRole === "teacher" ? handleBackToBusinessType : handleBackToRoleSelection}
                  type="button"
                  disabled={isLoading}
                >
                  {selectedRole === "teacher" ? "← Wróć" : "← Wróć"}
                </button>
              </div>
              {selectedRole === "student" ? STUDENT_TERMS : TEACHER_TERMS}
              <label className="flex items-start mt-2 sm:mt-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={e => {
                    setAcceptTerms(e.target.checked);
                    if (e.target.checked && registrationError) {
                      setRegistrationError(null);
                    }
                  }}
                  disabled={isLoading}
                  className={`form-checkbox h-4 w-4 mt-0.5 flex-shrink-0 ${selectedRole === "student" ? "accent-orange-500" : "accent-blue-500"} disabled:opacity-50`}
                />
                <span className={`ml-2 text-xs sm:text-sm leading-tight ${isLoading ? "text-gray-400" : "text-gray-700"}`}>
                  {selectedRole === "student"
                    ? "Akceptuję regulamin platformy Ecurs"
                    : "Akceptuję regulamin, warunki płatności i wyrażam zgodę na rejestrację w systemie płatności Stripe"}
                </span>
              </label>
              
              {selectedRole === "teacher" && (
                <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs sm:text-sm text-blue-700 font-medium">ℹ️ Następny krok:</p>
                  <p className="text-xs text-blue-600 mt-1 leading-tight">
                    Po kliknięciu &quot;Kontynuuj&quot; zostaniesz przekierowany na bezpieczną stronę Stripe w celu konfiguracji konta płatności. 
                    Po zakończeniu procesu automatycznie wrócisz na platformę Ecurs.
                  </p>
                </div>
              )}
              
              <button
                onClick={handleSignUp}
                disabled={isLoading || !isSignedIn || !acceptTerms}
                className={`w-full mt-3 sm:mt-4 py-3 px-3 sm:px-4 md:px-8 rounded-lg font-medium text-white text-sm sm:text-base lg:text-lg transition-all
                  ${selectedRole === "student"
                    ? (isLoading || !isSignedIn || !acceptTerms
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-orange-600 hover:bg-orange-700 hover:shadow-lg")
                    : (isLoading || !isSignedIn || !acceptTerms
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
                  "Zarejestruj się jako uczeń"
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
        </div>
      </div>
    </>
  );
}
