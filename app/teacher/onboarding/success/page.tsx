"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useI18n } from "@/hooks/use-i18n";

type OnboardingStatus = "checking" | "complete" | "incomplete" | "error";

export default function OnboardingSuccessPage() {
  const { t } = useI18n();
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
        throw new Error(t("onboarding.success.error.checkFailed"));
      }

      const result = await response.json();
      
      if (result.hasAccount && result.onboardingComplete) {
        setStatus("complete");
        setAccountDetails(result.details);
        toast.success(t("onboarding.success.toast.completed"));
        
        // Redirect to teacher dashboard after 3 seconds
        setTimeout(() => {
          router.push("/teacher/courses");
        }, 3000);
      } else if (result.hasAccount && !result.onboardingComplete) {
        setStatus("incomplete");
        setError(t("onboarding.success.error.incomplete"));
        
        // Redirect to teacher dashboard after 5 seconds
        setTimeout(() => {
          router.push("/teacher/courses");
        }, 5000);
      } else {
        setStatus("error");
        setError(t("onboarding.success.error.accountNotFound"));
      }
    } catch (err) {
      console.error("Error checking onboarding status:", err);
      setStatus("error");
      setError(err instanceof Error ? err.message : t("onboarding.success.error.unexpected"));
      
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
        throw new Error(t("onboarding.success.error.newLinkFailed"));
      }

      const result = await response.json();
      
      if (result.onboardingUrl) {
        toast.success(t("onboarding.success.toast.redirectingAgain"));
        window.location.href = result.onboardingUrl;
      } else {
        throw new Error(t("onboarding.success.error.noLink"));
      }
    } catch (err) {
      console.error("Error retrying onboarding:", err);
      toast.error(err instanceof Error ? err.message : t("onboarding.success.error.retryStartFailed"));
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
            <h1 className="text-2xl font-bold text-gray-800">{t("onboarding.success.checkingTitle")}</h1>
            <p className="text-gray-600">
              {t("onboarding.success.checkingDescription")}
            </p>
          </>
        )}

        {status === "complete" && (
          <>
            <div className="flex justify-center">
              <CheckCircle className="text-green-600" size={48} />
            </div>
            <h1 className="text-2xl font-bold text-green-700">{t("onboarding.success.completeTitle")}</h1>
            <div className="space-y-3">
              <p className="text-gray-700">
                {t("onboarding.success.completeDescription")}
              </p>
              <ul className="text-left space-y-2 text-sm text-gray-600">
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>{t("onboarding.success.completeItemPublish")}</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>{t("onboarding.success.completeItemReceive")}</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>{t("onboarding.success.completeItemManage")}</span>
                </li>
              </ul>
            </div>
            
            {accountDetails && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs text-green-700">
                  <strong>{t("onboarding.success.accountStatusLabel")}</strong> {accountDetails.charges_enabled ? t("onboarding.success.accountStatusActive") : t("onboarding.success.accountStatusVerifying")}
                </p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700 font-medium">
                {t("onboarding.success.redirectingTitle")}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {t("onboarding.success.redirectingIn3")}
              </p>
            </div>
          </>
        )}

        {status === "incomplete" && (
          <>
            <div className="flex justify-center">
              <AlertCircle className="text-yellow-600" size={48} />
            </div>
            <h1 className="text-2xl font-bold text-yellow-700">{t("onboarding.success.incompleteTitle")}</h1>
            <div className="space-y-4">
              <p className="text-gray-700">
                {t("onboarding.success.incompleteDescription")}
              </p>
              <ul className="text-left space-y-2 text-sm text-gray-600">
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  <span>{t("onboarding.success.incompleteItemInfo")}</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  <span>{t("onboarding.success.incompleteItemDocs")}</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  <span>{t("onboarding.success.incompleteItemExtra")}</span>
                </li>
              </ul>

              <button
                onClick={retryOnboarding}
                className="w-full py-2 px-4 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                {t("onboarding.success.incompleteCta")}
              </button>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700 font-medium">
                  {t("onboarding.success.redirectingTitle")}
                </p>
                <p className="text-xs text-blue-600">
                  {t("onboarding.success.redirectingIn5")}
                </p>
              </div>
              <p className="text-xs text-gray-500">
                {t("onboarding.success.incompleteHint")}
              </p>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="flex justify-center">
              <AlertCircle className="text-red-600" size={48} />
            </div>
            <h1 className="text-2xl font-bold text-red-700">{t("onboarding.success.errorTitle")}</h1>
            <div className="space-y-4">
              <p className="text-gray-700">
                {error || t("onboarding.success.errorFallback")}
              </p>

              <div className="space-y-2">
                <button
                  onClick={retryOnboarding}
                  className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t("onboarding.success.retryCta")}
                </button>
                
                <button
                  onClick={() => router.push("/teacher/courses")}
                  className="w-full py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  {t("onboarding.success.goDashboard")}
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                <p className="text-sm text-blue-700 font-medium">
                  {t("onboarding.success.redirectingTitle")}
                </p>
                <p className="text-xs text-blue-600">
                  {t("onboarding.success.redirectingIn5")}
                </p>
              </div>
              <p className="text-xs text-gray-500">
                {t("onboarding.success.contactSupport")}
              </p>
            </div>
          </>
        )}

      </div>
    </div>
  );
}