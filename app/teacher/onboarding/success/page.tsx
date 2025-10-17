"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

type OnboardingStatus = "checking" | "complete" | "incomplete" | "error";

export default function OnboardingSuccessPage() {
  const [status, setStatus] = useState<OnboardingStatus>("checking");
  const [accountDetails, setAccountDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkStatus = async () => {
      await checkOnboardingStatus();
    };
    checkStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const response = await fetch("/api/stripe/connect", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Nie udało się sprawdzić statusu konta");
      }

      const result = await response.json();
      
      if (result.hasAccount && result.onboardingComplete) {
        setStatus("complete");
        setAccountDetails(result.details);
        toast.success("Konfiguracja konta płatności zakończona pomyślnie!");
        
        // Redirect to teacher dashboard after 3 seconds
        setTimeout(() => {
          router.push("/teacher/courses");
        }, 3000);
      } else if (result.hasAccount && !result.onboardingComplete) {
        setStatus("incomplete");
        setError("Konfiguracja konta nie została w pełni ukończona. Możesz dokończyć ją później.");
        
        // Redirect to teacher dashboard after 5 seconds
        setTimeout(() => {
          router.push("/teacher/courses");
        }, 5000);
      } else {
        setStatus("error");
        setError("Nie znaleziono konta płatności. Skontaktuj się z wsparciem technicznym.");
      }
    } catch (err) {
      console.error("Error checking onboarding status:", err);
      setStatus("error");
      setError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
      
      // Redirect to teacher dashboard after 5 seconds even on error
      setTimeout(() => {
        router.push("/teacher/courses");
      }, 5000);
    }
  };

  const retryOnboarding = async () => {
    try {
      const response = await fetch("/api/stripe/connect", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceOnboarding: true }),
      });

      if (!response.ok) {
        throw new Error("Nie udało się utworzyć nowego linku do konfiguracji");
      }

      const result = await response.json();
      
      if (result.onboardingUrl) {
        toast.success("Przekierowujemy do ponownej konfiguracji...");
        window.location.href = result.onboardingUrl;
      } else {
        throw new Error("Nie otrzymano linku do konfiguracji");
      }
    } catch (err) {
      console.error("Error retrying onboarding:", err);
      toast.error(err instanceof Error ? err.message : "Nie udało się rozpocząć ponownej konfiguracji");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white p-4">
      <div className="max-w-md mx-auto text-center p-8 space-y-6 bg-white rounded-xl shadow-lg border border-blue-100">
        
        {status === "checking" && (
          <>
            <div className="flex justify-center">
              <Loader2 className="animate-spin text-blue-600" size={48} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Sprawdzanie statusu konfiguracji...</h1>
            <p className="text-gray-600">
              Prosimy o chwilę cierpliwości, sprawdzamy czy konfiguracja Stripe została ukończona pomyślnie.
            </p>
          </>
        )}

        {status === "complete" && (
          <>
            <div className="flex justify-center">
              <CheckCircle className="text-green-600" size={48} />
            </div>
            <h1 className="text-2xl font-bold text-green-700">Konfiguracja ukończona!</h1>
            <div className="space-y-3">
              <p className="text-gray-700">
                Twoje konto płatności zostało pomyślnie skonfigurowane. Możesz teraz:
              </p>
              <ul className="text-left space-y-2 text-sm text-gray-600">
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Tworzyć i publikować płatne kursy</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Otrzymywać płatności bezpośrednio na swoje konto</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Zarządzać swoimi finansami przez panel Stripe</span>
                </li>
              </ul>
            </div>
            
            {accountDetails && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs text-green-700">
                  <strong>Status konta:</strong> {accountDetails.charges_enabled ? "Aktywne" : "W trakcie weryfikacji"}
                </p>
              </div>
            )}

            <p className="text-sm text-gray-500">
              Zostaniesz automatycznie przekierowany do panelu nauczyciela za chwilę...
            </p>
          </>
        )}

        {status === "incomplete" && (
          <>
            <div className="flex justify-center">
              <AlertCircle className="text-yellow-600" size={48} />
            </div>
            <h1 className="text-2xl font-bold text-yellow-700">Konfiguracja nie ukończona</h1>
            <div className="space-y-4">
              <p className="text-gray-700">
                Konfiguracja konta płatności nie została w pełni ukończona. To może oznaczać, że:
              </p>
              <ul className="text-left space-y-2 text-sm text-gray-600">
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  <span>Nie wypełniono wszystkich wymaganych informacji</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  <span>Dokumenty są w trakcie weryfikacji</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  <span>Wymagane dodatkowe potwierdzenia</span>
                </li>
              </ul>

              <button
                onClick={retryOnboarding}
                className="w-full py-2 px-4 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Dokończ konfigurację teraz
              </button>

              <p className="text-xs text-gray-500">
                Możesz też dokończyć konfigurację później z panelu nauczyciela.
              </p>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="flex justify-center">
              <AlertCircle className="text-red-600" size={48} />
            </div>
            <h1 className="text-2xl font-bold text-red-700">Wystąpił problem</h1>
            <div className="space-y-4">
              <p className="text-gray-700">
                {error || "Nie udało się sprawdzić statusu konfiguracji konta płatności."}
              </p>

              <div className="space-y-2">
                <button
                  onClick={retryOnboarding}
                  className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Spróbuj ponownie skonfigurować konto
                </button>
                
                <button
                  onClick={() => router.push("/teacher/courses")}
                  className="w-full py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Przejdź do panelu nauczyciela
                </button>
              </div>

              <p className="text-xs text-gray-500">
                Jeśli problem się powtarza, skontaktuj się z wsparciem technicznym.
              </p>
            </div>
          </>
        )}

      </div>
    </div>
  );
}