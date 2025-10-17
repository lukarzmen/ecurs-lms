"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

export default function OnboardingRefreshPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to create new onboarding link
    const refreshOnboarding = async () => {
      try {
        const response = await fetch('/api/stripe/connect', {
          method: 'POST'
        });
        const data = await response.json();
        
        if (data.onboardingUrl) {
          toast.success('Przekierowujemy Cię ponownie do konfiguracji konta');
          window.location.href = data.onboardingUrl;
        } else {
          toast.error('Błąd podczas odświeżania procesu onboardingu');
          router.push('/teacher/courses');
        }
      } catch (error) {
        console.error('Error refreshing onboarding:', error);
        toast.error('Błąd podczas odświeżania procesu onboardingu');
        router.push('/teacher/courses');
      }
    };

    refreshOnboarding();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
      <div className="flex flex-col items-center max-w-md mx-auto text-center p-6 space-y-6 bg-white rounded-xl shadow-md border border-blue-100">
        <RefreshCw className="w-16 h-16 text-blue-600 animate-spin" />
        <h1 className="text-2xl font-bold text-blue-700">
          Odświeżanie konfiguracji...
        </h1>
        <p className="text-gray-600">
          Przygotowujemy nowy link do konfiguracji Twojego konta Stripe.
        </p>
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    </div>
  );
}