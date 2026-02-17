export const SUPPORTED_APP_LOCALES = ["en", "it"] as const;

export type AppLocale = (typeof SUPPORTED_APP_LOCALES)[number];

export const DEFAULT_APP_LOCALE: AppLocale = "en";

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && SUPPORTED_APP_LOCALES.includes(value as AppLocale);
}

export function normalizeAppLocale(value: unknown): AppLocale {
  if (!isAppLocale(value)) {
    return DEFAULT_APP_LOCALE;
  }

  return value;
}
