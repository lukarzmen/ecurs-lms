"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const TERMS_EFFECTIVE_DATE = "18.10.2025";
const TERMS_LAST_UPDATE = "18.10.2025";

const STUDENT_TERMS = (
  <div className="text-left max-h-64 overflow-y-auto px-2 py-2 bg-orange-50 rounded-lg border border-orange-200 shadow-inner text-sm leading-relaxed space-y-2">
    <h2 className="text-lg font-bold text-orange-700 mb-2">📜 Warunki uczestnictwa użytkownika w platformie Ecurs</h2>
    <p className="text-xs text-gray-500 mb-2">
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
      <li>Płatność za kurs jest jednorazowa i umożliwia dostęp do materiałów przez czas określony przez nauczyciela.</li>
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
  <div className="text-left max-h-64 overflow-y-auto px-2 py-2 bg-blue-50 rounded-lg border border-blue-200 shadow-inner text-sm leading-relaxed space-y-2">
    <h2 className="text-lg font-bold text-blue-700 mb-2">📜 Warunki uczestnictwa nauczyciela w platformie Ecurs</h2>
    <p className="text-xs text-gray-500 mb-2">
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
        <b>Prawo do anulowania subskrypcji:</b> Użytkownik ma prawo do anulowania subskrypcji w dowolnym momencie bez ponoszenia dodatkowych kosztów, z wyjątkiem należności za już rozpoczęty okres rozliczeniowy.
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

type RegistrationStep = "role-selection" | "terms-acceptance" | "user-creation" | "stripe-setup" | "completed";
type LoadingState = "idle" | "creating-user" | "creating-stripe-account" | "redirecting-to-stripe" | "updating-user";

export default function RegisterPage() {
  const { isSignedIn, userId, sessionId } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [currentStep, setCurrentStep] = useState<RegistrationStep>("role-selection");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [selectedRole, setSelectedRole] = useState<null | "student" | "teacher">(null);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const router = useRouter();

  const getStepNumber = (step: RegistrationStep): number => {
    const stepMap = {
      "role-selection": 1,
      "terms-acceptance": 2,
      "user-creation": 3,
      "stripe-setup": 4,
      "completed": 5
    };
    return stepMap[step];
  };

  const getLoadingMessage = (state: LoadingState): string => {
    const messages = {
      "idle": "",
      "creating-user": "Tworzenie konta użytkownika...",
      "creating-stripe-account": "Przygotowywanie konta płatności...",
      "redirecting-to-stripe": "Przekierowywanie do Stripe...",
      "updating-user": "Aktualizowanie danych użytkownika..."
    };
    return messages[state];
  };

  const ProgressIndicator = ({ currentStep, selectedRole }: { currentStep: RegistrationStep; selectedRole: "student" | "teacher" | null }) => {
    if (!selectedRole || currentStep === "role-selection") return null;
    
    const steps = selectedRole === "teacher" 
      ? ["Wybór roli", "Akceptacja regulaminu", "Tworzenie konta", "Konfiguracja płatności", "Zakończone"]
      : ["Wybór roli", "Akceptacja regulaminu", "Tworzenie konta", "Zakończone"];
    
    const currentStepNumber = getStepNumber(currentStep);
    const totalSteps = steps.length;
    
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Postęp rejestracji</span>
          <span className="text-sm text-gray-500">{currentStepNumber}/{totalSteps}</span>
        </div>
        <div className="flex items-center space-x-2">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStepNumber;
            const isCurrent = stepNumber === currentStepNumber;
            
            return (
              <div key={index} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-colors
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
                    className={`w-8 h-0.5 mx-1 transition-colors
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
        <div className="mt-2 text-xs text-gray-600 text-center">
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
      
      const response = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, sessionId, roleId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || "Rejestracja nie powiodła się";
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
            const stripeError = await stripeResponse.json();
            throw new Error(stripeError.message || "Nie udało się utworzyć konta płatności");
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
          
          // Wait a bit then redirect to teacher panel
          setTimeout(() => {
            router.push("/teacher/courses");
          }, 3000);
        }
      } else {
        // Student registration or teacher without Stripe onboarding needed
        setCurrentStep("completed");
        toast.success("Rejestracja zakończona sukcesem!");
        
        const redirectPath = selectedRole === "teacher" ? "/teacher/courses" : "/";
        setTimeout(() => {
          router.push(redirectPath);
          router.refresh();
        }, 1000);
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

  const handleRoleSelection = (role: "student" | "teacher") => {
    setSelectedRole(role);
    setCurrentStep("terms-acceptance");
    setAcceptTerms(false);
    setRegistrationError(null);
    setLoadingState("idle");
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white p-4">
      <div className="flex flex-col items-center max-w-lg mx-auto text-center p-6 space-y-6 bg-white rounded-xl shadow-lg border border-orange-100">
        <h1 className="text-3xl font-bold text-orange-700">Witamy w Ecurs!</h1>
        <p className="text-gray-600">
          Dołącz do naszej platformy edukacyjnej, aby uzyskać dostęp do wszystkich kursów, zasobów i spersonalizowanych doświadczeń edukacyjnych.
        </p>
        <div className="w-16 h-1 bg-orange-500 mx-auto my-2 rounded"></div>
        
        <ProgressIndicator currentStep={currentStep} selectedRole={selectedRole} />
        
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
              <div className="flex flex-col gap-4">
                <button
                  className="w-full py-3 px-8 rounded-lg font-medium text-white text-lg bg-orange-600 hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handleRoleSelection("student")}
                  disabled={isLoading}
                >
                  👩‍🎓 Uczniem
                </button>
                <button
                  className="w-full py-3 px-8 rounded-lg font-medium text-white text-lg bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handleRoleSelection("teacher")}
                  disabled={isLoading}
                >
                  👨‍🏫 Nauczycielem
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className={`flex items-center gap-2 text-lg font-semibold ${selectedRole === "student" ? "text-orange-600" : "text-blue-600"}`}>
                  {selectedRole === "student" ? "👩‍🎓 Rejestracja ucznia" : "👨‍🏫 Rejestracja nauczyciela"}
                </span>
                <button
                  className="text-xs text-gray-500 underline hover:text-orange-700 transition disabled:opacity-50"
                  onClick={handleBackToRoleSelection}
                  type="button"
                  disabled={isLoading}
                >
                  Wróć do wyboru roli
                </button>
              </div>
              {selectedRole === "student" ? STUDENT_TERMS : TEACHER_TERMS}
              <label className="flex items-center mt-3 cursor-pointer select-none">
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
                  className={`form-checkbox h-4 w-4 ${selectedRole === "student" ? "accent-orange-500" : "accent-blue-500"} disabled:opacity-50`}
                />
                <span className={`ml-2 text-sm ${isLoading ? "text-gray-400" : "text-gray-700"}`}>
                  {selectedRole === "student"
                    ? "Akceptuję regulamin platformy Ecurs"
                    : "Akceptuję regulamin, warunki płatności i wyrażam zgodę na rejestrację w systemie płatności Stripe"}
                </span>
              </label>
              
              {selectedRole === "teacher" && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-700 font-medium">ℹ️ Następny krok:</p>
                  <p className="text-xs text-blue-600 mt-1">
                    Po kliknięciu &quot;Kontynuuj&quot; zostaniesz przekierowany na bezpieczną stronę Stripe w celu konfiguracji konta płatności. 
                    Po zakończeniu procesu automatycznie wrócisz na platformę Ecurs.
                  </p>
                </div>
              )}
              
              <button
                onClick={handleSignUp}
                disabled={isLoading || !isSignedIn || !acceptTerms}
                className={`w-full mt-4 py-3 px-8 rounded-lg font-medium text-white text-lg transition-all
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
                    <Loader2 className="animate-spin" size={20} />
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
  );
}
