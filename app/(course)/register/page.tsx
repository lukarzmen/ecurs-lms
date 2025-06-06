"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const STUDENT_TERMS = (
  <div className="text-left max-h-64 overflow-y-auto px-2 py-2 bg-orange-50 rounded-lg border border-orange-200 shadow-inner text-sm leading-relaxed space-y-2">
    <h2 className="text-lg font-bold text-orange-700 mb-2">📜 Warunki uczestnictwa użytkownika w platformie LMS</h2>
    <p className="font-semibold text-gray-700">§1. Postanowienia ogólne</p>
    <ul className="list-disc ml-6 text-gray-700">
      <li>Niniejszy regulamin określa zasady korzystania z platformy Ecurs, w tym prawa i obowiązki użytkowników.</li>
      <li>Korzystanie z platformy oznacza akceptację niniejszego regulaminu.</li>
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
    <p className="font-semibold text-gray-700 mt-2">§5. Postanowienia końcowe</p>
    <ul className="list-disc ml-6 text-gray-700">
      <li>Administrator zastrzega sobie prawo do zmiany regulaminu, informując o tym użytkowników.</li>
      <li>Wszelkie spory wynikające z korzystania z platformy będą rozstrzygane zgodnie z prawem polskim.</li>
      <li>Administrator zastrzega sobie prawo do usunięcia danych użytkownika po 360 dniach nieaktywności.</li>
    </ul>
    <p className="mt-4 text-xs text-gray-500">Akceptacja regulaminu jest wymagana do rejestracji.</p>
  </div>
);

const TEACHER_TERMS = (
  <div className="text-left max-h-64 overflow-y-auto px-2 py-2 bg-blue-50 rounded-lg border border-blue-200 shadow-inner text-sm leading-relaxed space-y-2">
    <h2 className="text-lg font-bold text-blue-700 mb-2">📜 Warunki uczestnictwa nauczyciela w platformie LMS</h2>
    <p className="font-semibold text-gray-700">§1. Postanowienia ogólne</p>
    <ul className="list-disc ml-6 text-gray-700">
      <li>Niniejszy regulamin określa zasady korzystania z platformy LMS przez nauczycieli, w tym prawa i obowiązki nauczycieli.</li>
      <li>Korzystanie z platformy jako nauczyciel oznacza akceptację niniejszego regulaminu.</li>
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
    <p className="font-semibold text-gray-700 mt-2">§5. Warunki płatności i licencja</p>
    <ul className="list-disc ml-6 text-gray-700">
      <li>Po zakończeniu okresu próbnego nauczyciel zobowiązany jest do uiszczenia opłaty zgodnej z obowiązującym cennikiem, w wyznaczonym terminie.</li>
      <li>Brak opłaty po okresie próbnym skutkuje zablokowaniem dostępu do funkcji nauczycielskich, a po upływie 180 dni od braku aktywnego konta nauczyciela (przy braku płatności za licencję) – usunięciem danych użytkownika.</li>
      <li>Wszelkie materiały udostępniane przez nauczyciela w ramach kursów pozostają jego własnością intelektualną, jednak nauczyciel udziela platformie Ecurs niewyłącznej, nieodpłatnej licencji na ich prezentację w ramach platformy na czas trwania kursu.</li>
      <li>W przypadku pytań dotyczących płatności lub faktur, prosimy o kontakt z administratorem platformy.</li>
    </ul>
    <p className="font-semibold text-gray-700 mt-2">§6. Postanowienia końcowe</p>
    <ul className="list-disc ml-6 text-gray-700">
      <li>Administrator zastrzega sobie prawo do zmiany regulaminu, informując o tym nauczycieli.</li>
      <li>Wszelkie spory wynikające z korzystania z platformy będą rozstrzygane zgodnie z prawem polskim.</li>
    </ul>
    <p className="mt-4 text-xs text-gray-500">Akceptacja regulaminu i warunków płatności jest wymagana do rejestracji jako nauczyciel.</p>
  </div>
);

export default function RegisterPage() {
    const { isSignedIn, userId, sessionId } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [acceptStudent, setAcceptStudent] = useState(false);
    const [acceptTeacher, setAcceptTeacher] = useState(false);
    const router = useRouter();

    const handleSignUp = async (roleId: number) => {
        if (!isSignedIn) {
            toast.error("Zaloguj się, aby zakończyć rejestrację");
            return;
        }
        if ((roleId === 0 && !acceptStudent) || (roleId === 1 && !acceptTeacher)) {
            toast.error("Aby się zarejestrować, musisz zaakceptować regulamin.");
            return;
        }

        try {
            setIsLoading(true);

            const response = await fetch("/api/user", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: userId,
                    sessionId: sessionId,
                    roleId: roleId,
                }),
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
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold text-orange-600 mb-2 flex items-center gap-2">👩‍🎓 Rejestracja ucznia</h2>
                        {STUDENT_TERMS}
                        <label className="flex items-center mt-3 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={acceptStudent}
                                onChange={e => setAcceptStudent(e.target.checked)}
                                className="form-checkbox accent-orange-500 h-4 w-4"
                            />
                            <span className="ml-2 text-sm text-gray-700">Akceptuję regulamin platformy Ecurs</span>
                        </label>
                        <button
                            onClick={() => handleSignUp(0)}
                            disabled={isLoading || !isSignedIn || !acceptStudent}
                            className={`w-full mt-4 py-3 px-8 rounded-lg font-medium text-white text-lg
                                ${isLoading || !isSignedIn || !acceptStudent
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-orange-600 hover:bg-orange-700 transition-colors"
                                }`}
                        >
                            {isLoading ? (
                                <Loader2 className="mx-auto animate-spin" size={24} />
                            ) : "Jestem uczniem"}
                        </button>
                    </div>
                    <div className="my-6 border-t border-orange-100"></div>
                    <div>
                        <h2 className="text-lg font-semibold text-blue-600 mb-2 flex items-center gap-2">👨‍🏫 Rejestracja nauczyciela</h2>
                        {TEACHER_TERMS}
                        <label className="flex items-center mt-3 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={acceptTeacher}
                                onChange={e => setAcceptTeacher(e.target.checked)}
                                className="form-checkbox accent-blue-500 h-4 w-4"
                            />
                            <span className="ml-2 text-sm text-gray-700">Akceptuję regulamin i warunki płatności</span>
                        </label>
                        <button
                            onClick={() => handleSignUp(1)}
                            disabled={isLoading || !isSignedIn || !acceptTeacher}
                            className={`w-full mt-4 py-3 px-8 rounded-lg font-medium text-white text-lg
                                ${isLoading || !isSignedIn || !acceptTeacher
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-700 transition-colors"
                                }`}
                        >
                            {isLoading ? (
                                <Loader2 className="mx-auto animate-spin" size={24} />
                            ) : "Jestem nauczycielem"}
                        </button>
                    </div>
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
