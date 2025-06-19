"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const TERMS_EFFECTIVE_DATE = "11.06.2025";
const TERMS_LAST_UPDATE = "11.06.2025";

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
    </ul>
    <p className="font-semibold text-gray-700 mt-2">§6. Postanowienia końcowe</p>
    <ul className="list-disc ml-6 text-gray-700">
      <li>Administrator zastrzega sobie prawo do zmiany regulaminu, informując o tym użytkowników.</li>
      <li>Wszelkie spory wynikające z korzystania z platformy będą rozstrzygane zgodnie z prawem polskim.</li>
      <li>Administrator zastrzega sobie prawo do usunięcia danych użytkownika po 360 dniach nieaktywności.</li>
    </ul>
    <p className="font-semibold text-gray-700 mt-2">§7. Pliki cookies</p>
    <ul className="list-disc ml-6 text-gray-700">
      <li>
        Serwis wykorzystuje pliki cookies w celu zapewnienia prawidłowego działania, personalizacji treści oraz analizy ruchu. Korzystając z serwisu, użytkownik wyraża zgodę na używanie plików cookies zgodnie z Polityką Prywatności. Użytkownik może zmienić ustawienia dotyczące cookies w swojej przeglądarce internetowej.
      </li>
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
    <p className="font-semibold text-gray-700 mt-2">§5. Warunki płatności, okresy rozliczeniowe i zmiana licencji</p>
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
            <b>Plan dla indywidualnych twórców prowadzących do 10 uczniów:</b> 39 zł za miesiąc – pełny dostęp do funkcji, tworzenie interaktywnych kursów, zarządzanie treściami i uczniami, podstawowe wsparcie techniczne.
          </li>
          <li>
            <b>Dla szkół i placówek edukacyjnych lub twórców posiadających więcej niż 10 uczniów:</b> 1699 zł za rok – pełny dostęp do wszystkich funkcjonalności, nielimitowani członkowie zespołu, pełne wsparcie techniczne.
          </li>
        </ul>
      </li>
      <li>
        <b>Mechanizm przejścia:</b> Jeśli liczba aktywnych uczniów przekroczy 10 lub do kursów zostanie przypisany drugi nauczyciel, użytkownik zostanie automatycznie poinformowany o konieczności przejścia na plan dla szkół. Informacja zostanie przekazana mailowo na adres podany przy rejestracji oraz poprzez komunikat w panelu platformy. Użytkownik ma 30 dni na przejście na wyższy plan.
      </li>
      <li>
        <b>Zasady naliczania opłat:</b> W przypadku zmiany planu w trakcie trwania okresu rozliczeniowego, opłata za nową licencję zostanie naliczona proporcjonalnie do pozostałego okresu rozliczeniowego.
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
    <p className="font-semibold text-gray-700 mt-2">§6. Pliki cookies</p>
    <ul className="list-disc ml-6 text-gray-700">
      <li>
        Serwis wykorzystuje pliki cookies w celu zapewnienia prawidłowego działania, personalizacji treści oraz analizy ruchu. Korzystając z serwisu, użytkownik wyraża zgodę na używanie plików cookies zgodnie z Polityką Prywatności. Użytkownik może zmienić ustawienia dotyczące cookies w swojej przeglądarce internetowej.
      </li>
    </ul>
    <p className="font-semibold text-gray-700 mt-2">§7. Postanowienia końcowe</p>
    <ul className="list-disc ml-6 text-gray-700">
      <li>Administrator zastrzega sobie prawo do zmiany regulaminu, informując o tym nauczycieli.</li>
      <li>Wszelkie spory wynikające z korzystania z platformy będą rozstrzygane zgodnie z prawem polskim.</li>
    </ul>
    <p className="mt-4 text-xs text-gray-500">
      Akceptacja regulaminu i warunków płatności poprzez kliknięcie „Akceptuję” jest wymagana do rejestracji jako nauczyciel.<br />
      O wszelkich zmianach w regulaminie nauczyciele zostaną poinformowani mailowo lub poprzez komunikat w serwisie. Dalsze korzystanie z platformy po zmianie regulaminu oznacza jego akceptację.
    </p>
  </div>
);

export default function RegisterPage() {
  const { isSignedIn, userId, sessionId } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [selectedRole, setSelectedRole] = useState<null | "student" | "teacher">(null);
  const router = useRouter();

  const handleSignUp = async () => {
    if (!isSignedIn) {
      toast.error("Zaloguj się, aby zakończyć rejestrację");
      return;
    }
    if (!acceptTerms) {
      toast.error("Aby się zarejestrować, musisz zaakceptować regulamin.");
      return;
    }
    const roleId = selectedRole === "student" ? 0 : 1;
    try {
      setIsLoading(true);
      const response = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, sessionId, roleId }),
      });
      if (response.ok) {
        toast.success("Rejestracja zakończona sukcesem!");
        router.push("/");
        router.refresh();
      } else {
        const errorData = await response.json();
        console.error("Błąd rejestracji użytkownika:", errorData);
        toast.error("Rejestracja nie powiodła się");
      }
    } catch (error) {
      console.error("Błąd rejestracji użytkownika:", error);
      toast.error("Nie udało się zarejestrować");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white">
      <div className="flex flex-col items-center max-w-md mx-auto text-center p-6 space-y-6 bg-white rounded-xl shadow-md border border-orange-100">
        <h1 className="text-3xl font-bold text-orange-700">Witamy w Ecurs!</h1>
        <p className="text-gray-600">
          Dołącz do naszej platformy edukacyjnej, aby uzyskać dostęp do wszystkich kursów, zasobów i spersonalizowanych doświadczeń edukacyjnych.
        </p>
        <div className="w-16 h-1 bg-orange-500 mx-auto my-2 rounded"></div>
        <div className="w-full">
          {!selectedRole ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Chcę być:</h2>
              <div className="flex flex-col gap-4">
                <button
                  className="w-full py-3 px-8 rounded-lg font-medium text-white text-lg bg-orange-600 hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                  onClick={() => { setSelectedRole("student"); setAcceptTerms(false); }}
                >
                  👩‍🎓 Uczniem
                </button>
                <button
                  className="w-full py-3 px-8 rounded-lg font-medium text-white text-lg bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  onClick={() => { setSelectedRole("teacher"); setAcceptTerms(false); }}
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
                  className="text-xs text-gray-500 underline hover:text-orange-700 transition"
                  onClick={() => setSelectedRole(null)}
                  type="button"
                >
                  Wróć do wyboru roli
                </button>
              </div>
              {selectedRole === "student" ? STUDENT_TERMS : TEACHER_TERMS}
              <label className="flex items-center mt-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={e => setAcceptTerms(e.target.checked)}
                  className={`form-checkbox h-4 w-4 ${selectedRole === "student" ? "accent-orange-500" : "accent-blue-500"}`}
                />
                <span className="ml-2 text-sm text-gray-700">
                  {selectedRole === "student"
                    ? "Akceptuję regulamin platformy Ecurs"
                    : "Akceptuję regulamin i warunki płatności"}
                </span>
              </label>
              <button
                onClick={handleSignUp}
                disabled={isLoading || !isSignedIn || !acceptTerms}
                className={`w-full mt-4 py-3 px-8 rounded-lg font-medium text-white text-lg
                  ${selectedRole === "student"
                    ? (isLoading || !isSignedIn || !acceptTerms
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-orange-600 hover:bg-orange-700 transition-colors")
                    : (isLoading || !isSignedIn || !acceptTerms
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 transition-colors")
                  }`}
              >
                {isLoading ? (
                  <Loader2 className="mx-auto animate-spin" size={24} />
                ) : selectedRole === "student" ? "Zarejestruj się jako uczeń" : "Zarejestruj się jako nauczyciel"}
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
