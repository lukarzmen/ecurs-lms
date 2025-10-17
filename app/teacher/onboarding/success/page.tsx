"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function OnboardingSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if onboarding is complete
    const checkOnboardingStatus = async () => {
      try {
        const response = await fetch('/api/stripe/connect');
        const data = await response.json();
        
        if (data.onboardingComplete) {
          toast.success('Konto Stripe zostało pomyślnie skonfigurowane!');
          setTimeout(() => {
            router.push('/teacher/courses');
          }, 2000);
        } else {
          // Still not complete, redirect back to onboarding
          toast.error('Onboarding nie został ukończony. Spróbuj ponownie.');
          router.push('/teacher/onboarding');
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        toast.error('Błąd podczas sprawdzania statusu konta');
        router.push('/teacher/onboarding');
      }
    };

    checkOnboardingStatus();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white">
      <div className="flex flex-col items-center max-w-md mx-auto text-center p-6 space-y-6 bg-white rounded-xl shadow-md border border-green-100">
        <CheckCircle className="w-16 h-16 text-green-600" />
        <h1 className="text-2xl font-bold text-green-700">
          Konfiguracja konta zakończona!
        </h1>
        <p className="text-gray-600">
          Sprawdzamy status Twojego konta Stripe. Za chwilę zostaniesz przekierowany do panelu nauczyciela.
        </p>
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    </div>
  );
}