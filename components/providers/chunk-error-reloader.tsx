"use client";

import { useEffect } from "react";

// Self-hosted deploys overwrite .next in place, so a tab left open across a
// deploy can request static chunks that no longer exist (400/404 -> ChunkLoadError).
// Force a one-time reload to fetch the current build instead of showing a blank/broken page.
const RELOAD_FLAG_KEY = "ecurs:chunk-error-reload";

function isChunkLoadError(message: unknown): boolean {
  if (typeof message !== "string") return false;
  return (
    message.includes("ChunkLoadError") ||
    message.includes("Loading chunk") ||
    message.includes("Failed to fetch dynamically imported module")
  );
}

function reloadOnce() {
  if (typeof window === "undefined") return;
  if (window.sessionStorage.getItem(RELOAD_FLAG_KEY)) return;
  window.sessionStorage.setItem(RELOAD_FLAG_KEY, "1");
  window.location.reload();
}

export function ChunkErrorReloader() {
  useEffect(() => {
    // Clear the guard once a page has loaded successfully after a reload.
    window.sessionStorage.removeItem(RELOAD_FLAG_KEY);

    const handleError = (event: ErrorEvent) => {
      if (isChunkLoadError(event.message) || isChunkLoadError(event.error?.name)) {
        reloadOnce();
      }
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      if (isChunkLoadError(reason?.message) || isChunkLoadError(reason?.name)) {
        reloadOnce();
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null;
}
