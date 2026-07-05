"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { XCircle, ArrowLeft, CreditCard } from "lucide-react";
import toast from "react-hot-toast";
import { useI18n } from "@/hooks/use-i18n";

function OnboardingCancelledContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();

  useEffect(() => {
    // Show cancellation message
    toast.error(t("onboarding.cancelled.toast.cancelled"));
  }, [t]);

  const retryOnboarding = async () => {
    try {
      const response = await fetch("/api/stripe/connect", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceOnboarding: true }),
      });

      if (!response.ok) {
        throw new Error(t("onboarding.cancelled.error.startFailed"));
      }

      const result = await response.json();
      
      if (result.onboardingUrl) {
        toast.success(t("onboarding.cancelled.toast.redirecting"));
        window.location.href = result.onboardingUrl;
      } else {
        throw new Error(t("onboarding.cancelled.error.noLink"));
      }
    } catch (error) {
      console.error("Error retrying onboarding:", error);
      toast.error(error instanceof Error ? error.message : t("onboarding.cancelled.error.startFailed"));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-white p-4">
      <div className="max-w-md mx-auto text-center p-8 space-y-6 bg-white rounded-xl shadow-lg border border-red-100">
        
        <div className="flex justify-center">
          <XCircle className="text-red-600" size={48} />
        </div>
        
        <h1 className="text-2xl font-bold text-red-700">{t("onboarding.cancelled.title")}</h1>
        
        <div className="space-y-4">
          <p className="text-gray-700">
            {t("onboarding.cancelled.description")}
          </p>
          
          <ul className="text-left space-y-2 text-sm text-gray-600">
            <li className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              <span>{t("onboarding.cancelled.itemPublish")}</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              <span>{t("onboarding.cancelled.itemReceive")}</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              <span>{t("onboarding.cancelled.itemManage")}</span>
            </li>
          </ul>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
            <p className="text-xs text-blue-700">
              <strong>{t("onboarding.cancelled.tipLabel")}</strong> {t("onboarding.cancelled.tipText")}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={retryOnboarding}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <CreditCard size={20} />
            <span>{t("onboarding.cancelled.retry")}</span>
          </button>
          
          <button
            onClick={() => router.push("/teacher/courses")}
            className="w-full py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
          >
            <ArrowLeft size={18} />
            <span>{t("onboarding.cancelled.goDashboard")}</span>
          </button>
        </div>

        <p className="text-xs text-gray-500">
          {t("onboarding.cancelled.legalInfo")}
        </p>

      </div>
    </div>
  );
}

export default function OnboardingCancelledPage() {
  const { t } = useI18n();

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-white p-4">
        <div className="max-w-md mx-auto text-center p-8 space-y-6 bg-white rounded-xl shadow-lg border border-red-100">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-red-600 border-t-transparent mx-auto"></div>
          <p className="text-gray-600">{t("common.loading")}</p>
        </div>
      </div>
    }>
      <OnboardingCancelledContent />
    </Suspense>
  );
}