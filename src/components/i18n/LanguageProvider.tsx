"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useUser } from "@clerk/nextjs";

import {
  DEFAULT_APP_LOCALE,
  normalizeAppLocale,
  type AppLocale,
} from "@/lib/i18n/locales";
import {
  getLocalizedMessage,
  type TranslationKey,
} from "@/lib/i18n/messages";

const STORAGE_KEY = "silicon-plan.uiLanguage";

type TranslationVars = Record<string, string | number>;

type LanguageContextValue = {
  locale: AppLocale;
  setLocale: (next: AppLocale) => void;
  t: (key: TranslationKey, vars?: TranslationVars) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function interpolate(message: string, vars?: TranslationVars): string {
  if (!vars) return message;

  return message.replace(/\{([a-zA-Z0-9_]+)\}/g, (full: string, key: string) => {
    const value = vars[key];
    if (value === undefined || value === null) return full;
    return String(value);
  });
}

function readLocaleFromStorage(): AppLocale {
  if (typeof window === "undefined") return DEFAULT_APP_LOCALE;
  return normalizeAppLocale(window.localStorage.getItem(STORAGE_KEY));
}

export default function LanguageProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const { user, isLoaded } = useUser();
  const [locale, setLocaleState] = useState<AppLocale>(DEFAULT_APP_LOCALE);
  const syncInFlightRef = useRef(false);
  const seededUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const localeFromStorage = readLocaleFromStorage();
    setLocaleState(localeFromStorage);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      seededUserIdRef.current = null;
      return;
    }
    if (seededUserIdRef.current === user.id) return;

    seededUserIdRef.current = user.id;

    const metadata =
      typeof user.unsafeMetadata === "object" && user.unsafeMetadata !== null
        ? (user.unsafeMetadata as Record<string, unknown>)
        : {};

    if (typeof metadata.uiLanguage === "string") {
      const metadataLocale = normalizeAppLocale(metadata.uiLanguage);
      setLocaleState(metadataLocale);
      return;
    }

    const localeFromStorage = readLocaleFromStorage();
    setLocaleState(localeFromStorage);
  }, [isLoaded, user]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, locale);
      document.documentElement.lang = locale;
    }
  }, [locale]);

  useEffect(() => {
    if (!isLoaded || !user || syncInFlightRef.current) return;

    const metadata =
      typeof user.unsafeMetadata === "object" && user.unsafeMetadata !== null
        ? (user.unsafeMetadata as Record<string, unknown>)
        : {};
    const metadataLocale = normalizeAppLocale(metadata.uiLanguage);
    const hasMetadataLocale = typeof metadata.uiLanguage === "string";

    if (metadataLocale === locale) return;
    if (!hasMetadataLocale && locale === DEFAULT_APP_LOCALE) return;

    syncInFlightRef.current = true;

    void user
      .update({
        unsafeMetadata: {
          ...metadata,
          uiLanguage: locale,
        },
      })
      .catch((error) => {
        console.error("Failed to persist ui language metadata", error);
      })
      .finally(() => {
        syncInFlightRef.current = false;
      });
  }, [isLoaded, locale, user]);

  const setLocale = useCallback((next: AppLocale) => {
    setLocaleState(normalizeAppLocale(next));
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: TranslationVars) => {
      const message = getLocalizedMessage(locale, key);
      return interpolate(message, vars);
    },
    [locale],
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
    }),
    [locale, setLocale, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}
