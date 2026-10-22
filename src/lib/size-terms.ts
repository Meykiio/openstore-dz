import type { Locale } from "./i18n";

/**
 * Size-guide column names in the buyer's language.
 *
 * Owners type the headings once, usually in Arabic. Almost every clothing guide
 * uses the same dozen words, so those are translated here; anything else is
 * shown as the owner wrote it. A "(cm)" suffix is kept in every language.
 */
type Term = { ar: string; fr: string; en: string; match: string[] };

const TERMS: Term[] = [
  {
    ar: "المقاس",
    fr: "Taille",
    en: "Size",
    match: ["المقاس", "المقاسات", "مقاس", "taille", "size"],
  },
  { ar: "الصدر", fr: "Poitrine", en: "Chest", match: ["الصدر", "صدر", "poitrine", "chest"] },
  { ar: "الطول", fr: "Longueur", en: "Length", match: ["الطول", "طول", "longueur", "length"] },
  {
    ar: "الخصر",
    fr: "Taille (tour)",
    en: "Waist",
    match: ["الخصر", "خصر", "tour de taille", "waist"],
  },
  { ar: "الورك", fr: "Hanches", en: "Hip", match: ["الورك", "الأرداف", "hanches", "hip", "hips"] },
  {
    ar: "الكتف",
    fr: "Épaules",
    en: "Shoulder",
    match: ["الكتف", "الأكتاف", "épaules", "epaules", "shoulder"],
  },
  { ar: "الكم", fr: "Manche", en: "Sleeve", match: ["الكم", "طول الكم", "manche", "sleeve"] },
  { ar: "العرض", fr: "Largeur", en: "Width", match: ["العرض", "عرض", "largeur", "width"] },
  { ar: "الوزن", fr: "Poids", en: "Weight", match: ["الوزن", "وزن", "poids", "weight"] },
  { ar: "القدم", fr: "Pied", en: "Foot", match: ["القدم", "طول القدم", "pied", "foot"] },
];

const UNIT = /\s*\(([^)]*)\)\s*$/;

const UNITS: Record<string, Record<Locale, string>> = {
  سم: { ar: "سم", fr: "cm", en: "cm" },
  cm: { ar: "سم", fr: "cm", en: "cm" },
  كغ: { ar: "كغ", fr: "kg", en: "kg" },
  kg: { ar: "كغ", fr: "kg", en: "kg" },
};

export function translateHeading(heading: string, locale: Locale): string {
  const unit = heading.match(UNIT)?.[1]?.trim() ?? null;
  const word = heading.replace(UNIT, "").trim().toLowerCase();
  const term = TERMS.find((t) => t.match.includes(word));
  if (!term) return heading;
  const translatedUnit = unit ? (UNITS[unit.toLowerCase()]?.[locale] ?? unit) : null;
  return translatedUnit ? `${term[locale]} (${translatedUnit})` : term[locale];
}
