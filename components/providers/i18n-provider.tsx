"use client";

import React, { createContext, useContext, useMemo } from "react";
import type { Locale } from "@/lib/i18n/types";

export type Messages = Record<string, string>;
type MessageParams = Record<string, string | number | boolean | null | undefined>;

type I18nContextValue = {
  locale: Locale;
  messages: Messages;
  t: (key: string, params?: MessageParams) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Messages;
  children: React.ReactNode;
}) {
  const value = useMemo<I18nContextValue>(() => {
    const t = (key: string, params?: MessageParams) => {
      const template = messages[key] ?? key;

      if (!params) {
        return template;
      }

      return template.replace(/\{(\w+)\}/g, (_, token: string) => {
        const value = params[token];
        return value === undefined || value === null ? `{${token}}` : String(value);
      });
    };
    return { locale, messages, t };
  }, [locale, messages]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}
