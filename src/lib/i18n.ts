/**
 * Locale handling.
 *
 * Arabic is the default and the reference dictionary. `TranslationKey` is
 * derived from it, so every other locale is forced by the compiler to cover the
 * same keys — a missing translation becomes a build failure, not a blank label.
 *
 * The choice lives in a cookie (mirrored in `localStorage`), so the server renders
 * the visitor's language from the first byte. A first visit has no cookie yet:
 * the server picks from `Accept-Language` and sets it in the same response.
 */

import { ar } from "./locales/ar";
import { fr } from "./locales/fr";
import { en } from "./locales/en";

export type Locale = "ar" | "fr" | "en";

export const LOCALES: readonly Locale[] = ["ar", "fr", "en"];
export const DEFAULT_LOCALE: Locale = "ar";

export type TranslationKey = keyof typeof ar;

const LOCALE_DIR: Record<Locale, "rtl" | "ltr"> = {
  ar: "rtl",
  fr: "ltr",
  en: "ltr",
};

const HTML_LANG: Record<Locale, string> = { ar: "ar", fr: "fr", en: "en" };

/** Endonym, so the switcher reads correctly whichever locale you are in. */
export const LOCALE_LABEL: Record<Locale, string> = {
  ar: "العربية",
  fr: "Français",
  en: "English",
};

const DICTS: Record<Locale, Record<TranslationKey, string>> = { ar, fr, en };

const STORAGE_KEY = "openstore-locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Replace `{name}` placeholders. Unknown placeholders are left untouched. */
function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = vars[key];
    return value === undefined ? match : String(value);
  });
}

export function translate(
  locale: Locale,
  key: TranslationKey,
  vars?: Record<string, string | number>,
): string {
  const dict = DICTS[locale] ?? DICTS[DEFAULT_LOCALE];
  const template = dict[key] ?? DICTS[DEFAULT_LOCALE][key] ?? key;
  return interpolate(template, vars);
}

export function readStoredLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return isLocale(raw) ? raw : null;
}

export function persistLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, locale);
  // The cookie is what lets the server render the next page in this language,
  // instead of rendering Arabic and switching after load.
  document.cookie = `${STORAGE_KEY}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

export function hasLocaleCookie(): boolean {
  return typeof document !== "undefined" && document.cookie.includes(`${STORAGE_KEY}=`);
}

/**
 * Best guess from the browser, used only when the visitor has never chosen.
 * Arabic is returned for `ar-*`; anything else falls back to Arabic rather than
 * guessing, because the platform is Arabic-first.
 */
export function detectLocale(): Locale {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  return pickLocale(navigator.languages ?? [navigator.language]);
}

/**
 * The first supported language in a preference list, as a browser sends it
 * (`navigator.languages`) or as a header carries it (`Accept-Language`, split
 * and stripped of `;q=` weights). The server and the browser use this same rule,
 * so a first visit renders in the language the browser would have picked.
 */
export function pickLocale(tags: readonly string[]): Locale {
  for (const tag of tags) {
    if (!tag) continue;
    const base = tag.toLowerCase().split("-")[0];
    if (base === "ar") return "ar";
    if (base === "fr") return "fr";
    if (base === "en") return "en";
  }
  return DEFAULT_LOCALE;
}

/** Apply `lang` and `dir` to `<html>`. Called on every locale change. */
export function applyLocaleToDocument(locale: Locale): void {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  html.setAttribute("lang", HTML_LANG[locale]);
  html.setAttribute("dir", LOCALE_DIR[locale]);
}

/**
 * Inline script so the first paint is already in the right direction. The cookie
 * is the server's own decision, so it wins; the stored choice is the fallback.
 * With neither it leaves `<html>` alone: the server already set `lang` and `dir`
 * from the browser's language, and forcing Arabic here is what made a first
 * English visit render left-to-right text right-to-left.
 */
export const localeBootstrapScript = `(function(){try{var m=document.cookie.match(/(?:^|; )${STORAGE_KEY}=(ar|fr|en)/);var l=m?m[1]:localStorage.getItem("${STORAGE_KEY}");if(l==="ar"||l==="fr"||l==="en"){document.documentElement.setAttribute("lang",l);document.documentElement.setAttribute("dir",l==="ar"?"rtl":"ltr");}}catch(e){}})();`;

/**
 * Pick the owner's text for a locale. Catalogue rows carry Arabic and a Latin
 * (French) version; English readers get the Latin one too, which they can read,
 * rather than Arabic they mostly cannot. Falls back to Arabic when no Latin text
 * was written.
 */
export function localized(locale: Locale, arabic: string, latin: string | null | undefined) {
  return locale !== "ar" && latin ? latin : arabic;
}
