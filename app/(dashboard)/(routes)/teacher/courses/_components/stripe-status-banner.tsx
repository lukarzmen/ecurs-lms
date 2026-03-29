"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, Clock, CreditCard } from "lucide-react";
import toast from "react-hot-toast";
import { useI18n } from "@/hooks/use-i18n";

interface StripeStatusProps {
  className?: string;
}

type StripeStatus = "loading" | "complete" | "incomplete" | "no-account" | "error";

interface StripeAccountDetails {
  hasAccount: boolean;
  onboardingComplete: boolean;
  accountStatus?: string;
  details?: {
    charges_enabled: boolean;
    payouts_enabled: boolean;
    details_submitted: boolean;
  };
}

interface TeacherSchoolStatus {
  isSchoolMember: boolean;
  isSchoolOwner: boolean;
}

export function StripeStatusBanner({ className = "" }: StripeStatusProps) {
  const [status, setStatus] = useState<StripeStatus>("loading");
  const [accountDetails, setAccountDetails] = useState<StripeAccountDetails | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [schoolStatus, setSchoolStatus] = useState<TeacherSchoolStatus | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    checkTeacherSchoolStatus();
    checkStripeStatus();
  }, []);

  const checkTeacherSchoolStatus = async () => {
    try {
      const response = await fetch("/api/teacher/school-status", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const result: TeacherSchoolStatus = await response.json();
        setSchoolStatus(result);
      }
    } catch (error) {
      console.error("Error checking teacher school status:", error);
    }
  };

  const checkStripeStatus = async () => {
    try {
      setStatus("loading");
      const response = await fetch("/api/stripe/connect", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(t('stripe.checkError'));
      }

      const result: StripeAccountDetails = await response.json();
      setAccountDetails(result);

      if (!result.hasAccount) {
        setStatus("no-account");
      } else if (result.onboardingComplete) {
        setStatus("complete");
      } else {
        setStatus("incomplete");
      }
    } catch (error) {
      console.error("Error checking Stripe status:", error);
      setStatus("error");
    }
  };

  const startOnboarding = async () => {
    try {
      setIsRetrying(true);
      const response = await fetch("/api/stripe/connect", {
        method: accountDetails?.hasAccount ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: accountDetails?.hasAccount 
          ? JSON.stringify({ forceOnboarding: true })
          : undefined,
      });

      if (!response.ok) {
        throw new Error(t('stripe.startError'));
      }

      const result = await response.json();
      
      if (result.onboardingUrl) {
        toast.success(t('stripe.redirecting'));
        window.location.href = result.onboardingUrl;
      } else {
        throw new Error(t('stripe.noLink'));
      }
    } catch (error) {
      console.error("Error starting onboarding:", error);
      toast.error(error instanceof Error ? error.message : t('stripe.startFailed'));
    } finally {
      setIsRetrying(false);
    }
  };

  // Don't show anything if complete
  if (status === "complete") {
    return null;
  }

  // Don't show banner if teacher is not the school owner
  // Only school owners need to configure Stripe - members don't pay
  if (schoolStatus && !schoolStatus.isSchoolOwner) {
    return null;
  }

  // Don't show anything while loading
  if (status === "loading") {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
          <span className="text-sm text-gray-600">{t('stripe.checking')}</span>
        </div>
      </div>
    );
  }

  const getStatusConfig = () => {
    switch (status) {
      case "no-account":
        return {
          icon: <CreditCard className="text-blue-600" size={20} />,
          title: t('stripe.noAccount.title'),
          description: t('stripe.noAccount.desc'),
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          buttonText: t('stripe.noAccount.button'),
          buttonColor: "bg-blue-600 hover:bg-blue-700"
        };
      case "incomplete":
        return {
          icon: <Clock className="text-yellow-600" size={20} />,
          title: t('stripe.incomplete.title'),
          description: t('stripe.incomplete.desc'),
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          buttonText: t('stripe.incomplete.button'),
          buttonColor: "bg-yellow-600 hover:bg-yellow-700"
        };
      case "error":
        return {
          icon: <AlertCircle className="text-red-600" size={20} />,
          title: t('stripe.error.title'),
          description: t('stripe.error.desc'),
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          buttonText: t('stripe.error.button'),
          buttonColor: "bg-red-600 hover:bg-red-700"
        };
      default:
        return {
          icon: <AlertCircle className="text-gray-600" size={20} />,
          title: t('stripe.unknown.title'),
          description: t('stripe.unknown.desc'),
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          buttonText: t('stripe.unknown.button'),
          buttonColor: "bg-gray-600 hover:bg-gray-700"
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`${config.bgColor} border ${config.borderColor} rounded-lg p-4 mb-6 ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 mb-1">
            {config.title}
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            {config.description}
          </p>
          
          {accountDetails?.details && status === "incomplete" && (
            <div className="mb-3 text-xs text-gray-500 space-y-1">
              <div className="flex items-center space-x-2">
                <span className={accountDetails.details.details_submitted ? "text-green-600" : "text-yellow-600"}>
                  {accountDetails.details.details_submitted ? "✓" : "○"}
                </span>
                <span>{t('stripe.basicData')} {accountDetails.details.details_submitted ? t('stripe.completed') : t('stripe.required')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={accountDetails.details.charges_enabled ? "text-green-600" : "text-yellow-600"}>
                  {accountDetails.details.charges_enabled ? "✓" : "○"}
                </span>
                <span>{t('stripe.acceptPayments')} {accountDetails.details.charges_enabled ? t('stripe.active') : t('stripe.inactive')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={accountDetails.details.payouts_enabled ? "text-green-600" : "text-yellow-600"}>
                  {accountDetails.details.payouts_enabled ? "✓" : "○"}
                </span>
                <span>{t('stripe.payouts')} {accountDetails.details.payouts_enabled ? t('stripe.active') : t('stripe.inactive')}</span>
              </div>
            </div>
          )}
          
          <button
            onClick={status === "error" ? checkStripeStatus : startOnboarding}
            disabled={isRetrying}
            className={`inline-flex items-center px-3 py-2 text-sm font-medium text-white rounded-md transition-colors ${config.buttonColor} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isRetrying ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent mr-2"></div>
                {t('stripe.processing')}
              </>
            ) : (
              config.buttonText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}