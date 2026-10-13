/**
 * Formatting helpers.
 *
 * Money is an integer number of dinar everywhere in the database. These
 * functions format, they never do arithmetic — all money math happens in
 * Postgres, so no float ever touches a price.
 *
 * Prices always render in Western digits, even inside Arabic text. Algerian
 * commerce quotes prices in Western numerals, and Arabic-Indic digits in a
 * price tag read as foreign. The unit suffix differs by language though, so
 * both are provided.
 */

import type { Locale } from "./i18n";

const UNIT: Record<Locale, string> = {
  ar: "دج",
  fr: "DA",
  en: "DA",
};

/** "2 500 دج" in Arabic, "2 500 DA" in French and English. */
export function formatDzd(amount: number, locale: Locale = "ar"): string {
  const digits = new Intl.NumberFormat("en-US").format(Math.round(amount));
  return `${digits} ${UNIT[locale]}`;
}

const DATE_LOCALE: Record<Locale, string> = {
  ar: "ar-DZ",
  fr: "fr-DZ",
  en: "en-GB",
};

function formatDate(iso: string, locale: Locale = "ar"): string {
  return new Intl.DateTimeFormat(DATE_LOCALE[locale], {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

export function formatDateTime(iso: string, locale: Locale = "ar"): string {
  return new Intl.DateTimeFormat(DATE_LOCALE[locale], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** Short "3 days ago" style label, used on reviews and the order queue. */
export function formatRelative(iso: string, locale: Locale = "ar"): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days < 1) return locale === "ar" ? "اليوم" : locale === "fr" ? "aujourd'hui" : "today";
  if (days === 1) return locale === "ar" ? "أمس" : locale === "fr" ? "hier" : "yesterday";
  if (days < 30) {
    const n = days;
    return locale === "ar" ? `قبل ${n} يوم` : locale === "fr" ? `il y a ${n} j` : `${n} days ago`;
  }
  return formatDate(iso, locale);
}

/** Initials for an avatar fallback when a reviewer has no photo. */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("");
}

/** Turn a product name into a URL-safe slug. Arabic letters are preserved. */
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}
