import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  applyLocaleToDocument,
  DEFAULT_LOCALE,
  detectLocale,
  persistLocale,
  readStoredLocale,
  translate,
  type Locale,
  type TranslationKey,
} from "./i18n";

type I18nValue = {
  locale: Locale;
  dir: "rtl" | "ltr";
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

/**
 * Locale provider.
 *
 * Initial state is always the default locale so server and first client render
 * agree. The stored preference is applied in an effect, after hydration.
 */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const stored = readStoredLocale();
    const next = stored ?? detectLocale();
    if (next !== DEFAULT_LOCALE) setLocaleState(next);
    applyLocaleToDocument(next);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    persistLocale(next);
    applyLocaleToDocument(next);
  }, []);

  const value = useMemo<I18nValue>(
    () => ({
      locale,
      dir: locale === "ar" ? "rtl" : "ltr",
      setLocale,
      t: (key, vars) => translate(locale, key, vars),
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (ctx) return ctx;
  // Outside the provider (a stray component in a test) fall back to Arabic
  // rather than throwing, so a single missing wrapper cannot blank a page.
  return {
    locale: DEFAULT_LOCALE,
    dir: "rtl",
    setLocale: () => {},
    t: (key, vars) => translate(DEFAULT_LOCALE, key, vars),
  };
}

/** Shorthand for the common case of only needing the translator. */
export function useT() {
  return useI18n().t;
}
