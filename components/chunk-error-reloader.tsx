"use client";

import { useEffect } from "react";

const RELOAD_FLAG_KEY = "ecurs:chunk-error-reload";

function isChunkLoadError(reason: unknown): boolean {
  const message = reason instanceof Error ? reason.message : String(reason ?? "");
  const name = reason instanceof Error ? reason.name : "";
  return (
    name === "ChunkLoadError" ||
    /ChunkLoadError|Loading chunk [\w.-]+ failed|Failed to fetch dynamically imported module/i.test(message)
  );
}

// Stale tabs reference old build chunk hashes after a deploy; reload once to fetch the current build.
export function ChunkErrorReloader() {
  useEffect(() => {
    const reloadOnce = () => {
      if (sessionStorage.getItem(RELOAD_FLAG_KEY)) return;
      sessionStorage.setItem(RELOAD_FLAG_KEY, "1");
      window.location.reload();
    };

    const handleError = (event: ErrorEvent) => {
      if (isChunkLoadError(event.error ?? event.message)) reloadOnce();
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
      if (isChunkLoadError(event.reason)) reloadOnce();
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
