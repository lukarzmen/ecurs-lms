import "server-only";

import { cookies, headers } from "next/headers";
import path from "path";
import { promises as fs } from "fs";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from "./types";

export type Messages = Record<string, string>;

function normalizeLocale(input: string | null | undefined): Locale {
  if (!input) return DEFAULT_LOCALE;
  const lower = input.toLowerCase();

  if (lower.startsWith("en")) return "en";
  if (lower.startsWith("pl")) return "pl";

  return DEFAULT_LOCALE;
}

export async function getRequestLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("locale")?.value;
  if (cookieLocale && (SUPPORTED_LOCALES as readonly string[]).includes(cookieLocale)) {
    return cookieLocale as Locale;
  }

  const headerStore = await headers();
  const acceptLanguage = headerStore.get("accept-language");
  // e.g. "en-US,en;q=0.9,pl;q=0.8"
  const first = acceptLanguage?.split(",")[0]?.trim();
  return normalizeLocale(first);
}

export async function getMessages(locale: Locale, namespace: string = "common"): Promise<Messages> {
  const filePath = path.join(process.cwd(), "public", "locales", locale, `${namespace}.json`);
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as Messages;
}

export function createTranslator(messages: Messages) {
  return (key: string): string => messages[key] ?? key;
}
