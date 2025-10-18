"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { XCircle, ArrowLeft, CreditCard } from "lucide-react";
import toast from "react-hot-toast";

function OnboardingCancelledContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Show cancellation message
    toast.error("Konfiguracja konta płatności została anulowana");
  }, []);

  const retryOnboarding = async () => {
    try {
      const response = await fetch("/api/stripe/connect", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceOnboarding: true }),
      });

      if (!response.ok) {
        throw new Error("Nie udało się rozpocząć konfiguracji");
      }

      const result = await response.json();
      
      if (result.onboardingUrl) {
        toast.success("Przekierowujemy ponownie do konfiguracji...");
        window.location.href = result.onboardingUrl;
      } else {
        throw new Error("Nie otrzymano linku do konfiguracji");
      }
    } catch (error) {
      console.error("Error retrying onboarding:", error);
      toast.error(error instanceof Error ? error.message : "Nie udało się rozpocząć konfiguracji");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-white p-4">
      <div className="max-w-md mx-auto text-center p-8 space-y-6 bg-white rounded-xl shadow-lg border border-red-100">
        
        <div className="flex justify-center">
          <XCircle className="text-red-600" size={48} />
        </div>
        
        <h1 className="text-2xl font-bold text-red-700">Konfiguracja anulowana</h1>
        
        <div className="space-y-4">
          <p className="text-gray-700">
            Konfiguracja konta płatności została anulowana. Bez ukończenia tego procesu nie będziesz mógł:
          </p>
          
          <ul className="text-left space-y-2 text-sm text-gray-600">
            <li className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              <span>Publikować płatnych kursów</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              <span>Otrzymywać płatności od uczniów</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              <span>Zarządzać finansami kursu</span>
            </li>
          </ul>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
            <p className="text-xs text-blue-700">
              <strong>💡 Pamiętaj:</strong> Możesz dokończyć konfigurację konta płatności w dowolnym momencie z panelu nauczyciela.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={retryOnboarding}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <CreditCard size={20} />
            <span>Spróbuj ponownie skonfigurować</span>
          </button>
          
          <button
            onClick={() => router.push("/teacher/courses")}
            className="w-full py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
          >
            <ArrowLeft size={18} />
            <span>Przejdź do panelu nauczyciela</span>
          </button>
        </div>

        <p className="text-xs text-gray-500">
          Konfiguracja konta płatności jest wymagana przez przepisy dotyczące przetwarzania płatności online.
        </p>

      </div>
    </div>
  );
}

export default function OnboardingCancelledPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-white p-4">
        <div className="max-w-md mx-auto text-center p-8 space-y-6 bg-white rounded-xl shadow-lg border border-red-100">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-red-600 border-t-transparent mx-auto"></div>
          <p className="text-gray-600">Ładowanie...</p>
        </div>
      </div>
    }>
      <OnboardingCancelledContent />
    </Suspense>
  );
}