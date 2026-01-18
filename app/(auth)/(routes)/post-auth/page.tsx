"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

const isSafeRelativeRedirect = (value: string) => {
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//")) return false;
  return true;
};

export default function PostAuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, isSignedIn, userId, sessionId } = useAuth();

  const redirectUrl = useMemo(() => {
    const value = searchParams.get("redirectUrl");
    if (!value) return null;
    return isSafeRelativeRedirect(value) ? value : null;
  }, [searchParams]);

  useEffect(() => {
    if (!isLoaded) return;

    const doRedirect = async () => {
      const postAuthReturn = redirectUrl
        ? `/post-auth?redirectUrl=${encodeURIComponent(redirectUrl)}`
        : "/post-auth";

      if (!isSignedIn || !userId) {
        router.replace(`/sign-in?redirectUrl=${encodeURIComponent(postAuthReturn)}`);
        return;
      }

      if (!sessionId) {
        // Wait for sessionId to appear; avoids racing right after sign-in.
        return;
      }

      try {
        const res = await fetch(
          `/api/user?userId=${encodeURIComponent(userId)}&sessionId=${encodeURIComponent(
            sessionId
          )}`,
          { cache: "no-store" }
        );
        const data = await res.json();

        if (!data?.exists) {
          const registerUrl = redirectUrl
            ? `/register?redirectUrl=${encodeURIComponent(redirectUrl)}`
            : "/register";
          router.replace(registerUrl);
          return;
        }

        router.replace(redirectUrl ?? "/");
      } catch {
        const registerUrl = redirectUrl
          ? `/register?redirectUrl=${encodeURIComponent(redirectUrl)}`
          : "/register";
        router.replace(registerUrl);
      }
    };

    void doRedirect();
  }, [isLoaded, isSignedIn, redirectUrl, router, sessionId, userId]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center space-y-2">
        <div className="text-lg font-semibold">Przekierowuję…</div>
        <div className="text-sm text-muted-foreground">
          Kończymy logowanie i sprawdzamy konto.
        </div>
      </div>
    </div>
  );
}
