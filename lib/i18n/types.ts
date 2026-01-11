export const SUPPORTED_LOCALES = ["pl", "en"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "pl";
