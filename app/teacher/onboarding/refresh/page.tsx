"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function OnboardingRefreshPage() {
  const [isRedirecting, setIsRedirecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const refreshOnboarding = async () => {
      try {
        // Try to create a new onboarding link
        const response = await fetch("/api/stripe/connect", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ forceOnboarding: true }),
        });

        if (!response.ok) {
          throw new Error("Nie udało się odświeżyć linku do konfiguracji");
        }

        const result = await response.json();
        
        if (result.onboardingUrl) {
          toast.success("Odświeżono link do konfiguracji, przekierowujemy...");
          // Small delay to show the message
          setTimeout(() => {
            window.location.href = result.onboardingUrl;
          }, 1500);
        } else {
          throw new Error("Nie otrzymano nowego linku do konfiguracji");
        }
      } catch (err) {
        console.error("Error refreshing onboarding:", err);
        setError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
        setIsRedirecting(false);
        
        // Redirect to teacher dashboard after 5 seconds on error
        setTimeout(() => {
          router.push("/teacher/courses");
        }, 5000);
      }
    };

    refreshOnboarding();
  }, [router]);

  const manualRetry = async () => {
    setError(null);
    setIsRedirecting(true);
    
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
        toast.success("Przekierowujemy do konfiguracji...");
        window.location.href = result.onboardingUrl;
      } else {
        throw new Error("Nie otrzymano linku do konfiguracji");
      }
    } catch (err) {
      console.error("Manual retry error:", err);
      setError(err instanceof Error ? err.message : "Nie udało się rozpocząć konfiguracji");
      setIsRedirecting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white p-4">
      <div className="max-w-md mx-auto text-center p-8 space-y-6 bg-white rounded-xl shadow-lg border border-orange-100">
        
        {isRedirecting && !error && (
          <>
            <div className="flex justify-center">
              <RefreshCw className="animate-spin text-orange-600" size={48} />
            </div>
            <h1 className="text-2xl font-bold text-orange-700">Odświeżanie konfiguracji</h1>
            <p className="text-gray-600">
              Przygotowujemy nowy link do konfiguracji konta płatności. 
              Za chwilę zostaniesz przekierowany do Stripe.
            </p>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-xs text-orange-700">
                <strong>Dlaczego to się dzieje?</strong><br />
                Link do konfiguracji wygasł lub nastąpił błąd podczas procesu. 
                Tworzymy nowy, bezpieczny link.
              </p>
            </div>
          </>
        )}

        {error && (
          <>
            <div className="flex justify-center">
              <AlertCircle className="text-red-600" size={48} />
            </div>
            <h1 className="text-2xl font-bold text-red-700">Problem z odświeżeniem</h1>
            <div className="space-y-4">
              <p className="text-gray-700">{error}</p>
              
              <div className="space-y-2">
                <button
                  onClick={manualRetry}
                  disabled={isRedirecting}
                  className="w-full py-2 px-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  {isRedirecting ? (
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="animate-spin" size={16} />
                      <span>Próbuję ponownie...</span>
                    </div>
                  ) : (
                    "Spróbuj ponownie"
                  )}
                </button>
                
                <button
                  onClick={() => router.push("/teacher/courses")}
                  className="w-full py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Przejdź do panelu nauczyciela
                </button>
              </div>

              <p className="text-xs text-gray-500">
                Możesz dokończyć konfigurację później z panelu nauczyciela.
              </p>
            </div>
          </>
        )}

      </div>
    </div>
  );
}