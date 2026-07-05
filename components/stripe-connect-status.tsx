"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle, CreditCard, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useI18n } from "@/hooks/use-i18n";

interface StripeAccountStatus {
  hasAccount: boolean;
  onboardingComplete: boolean;
  accountStatus?: string;
  accountId?: string;
}

export default function StripeConnectStatus() {
  const { t } = useI18n();
  const [status, setStatus] = useState<StripeAccountStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    checkStripeStatus();
  }, []);

  const checkStripeStatus = async () => {
    try {
      const response = await fetch('/api/stripe/connect');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Error checking Stripe status:', error);
      toast.error(t("stripeStatus.error.checkFailed"));
    } finally {
      setLoading(false);
    }
  };

  const setupStripeAccount = async () => {
    setCreating(true);
    try {
      const response = await fetch('/api/stripe/connect', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.onboardingUrl) {
        toast.success(t("stripeStatus.toast.redirectSetup"));
        window.location.href = data.onboardingUrl;
      } else {
        toast.error(t("stripeStatus.error.createFailed"));
      }
    } catch (error) {
      console.error('Error setting up Stripe account:', error);
      toast.error(t("stripeStatus.error.setupFailed"));
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2">{t("stripeStatus.loading")}</span>
        </div>
      </div>
    );
  }

  if (!status?.hasAccount) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
        <div className="flex items-start">
          <AlertTriangle className="w-6 h-6 text-orange-600 mt-0.5" />
          <div className="ml-3 flex-1">
            <h3 className="text-lg font-medium text-orange-800">
              {t("stripeStatus.required.title")}
            </h3>
            <p className="mt-1 text-sm text-orange-700">
              {t("stripeStatus.required.description")}
            </p>
            <button
              onClick={setupStripeAccount}
              disabled={creating}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {t("stripeStatus.required.creating")}
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  {t("stripeStatus.required.cta")}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!status.onboardingComplete) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start">
          <AlertTriangle className="w-6 h-6 text-yellow-600 mt-0.5" />
          <div className="ml-3 flex-1">
            <h3 className="text-lg font-medium text-yellow-800">
              {t("stripeStatus.incomplete.title")}
            </h3>
            <p className="mt-1 text-sm text-yellow-700">
              {t("stripeStatus.incomplete.description")}
            </p>
            <button
              onClick={setupStripeAccount}
              disabled={creating}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {t("stripeStatus.incomplete.redirecting")}
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  {t("stripeStatus.incomplete.cta")}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
      <div className="flex items-start">
        <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
        <div className="ml-3">
          <h3 className="text-lg font-medium text-green-800">
            {t("stripeStatus.ready.title")}
          </h3>
          <p className="mt-1 text-sm text-green-700">
            {t("stripeStatus.ready.description")}
          </p>
          {status.accountId && (
            <p className="mt-2 text-xs text-green-600">
              {t("stripeStatus.ready.accountId").replace("{id}", status.accountId)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}