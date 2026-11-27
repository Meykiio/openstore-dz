import type { Locale, TranslationKey } from "./i18n";

/**
 * The vocabulary of the four universes.
 *
 * These are names, not database rows. A shop can sell a Barcelona hoodie before
 * anyone creates a "Barcelona" category, and the storefront should still file it
 * under Football → Barcelona. Matching normalises the Arabic and Latin text a
 * product already carries, so nothing here invents stock, prices or taxonomy in
 * the database.
 */

export type Named = {
  key: string;
  ar: string;
  fr: string;
  en: string;
  aliases: string[];
};

export type PieceType = { key: string; labelKey: TranslationKey; aliases: string[] };

export const PIECE_TYPES: PieceType[] = [
  {
    key: "tee",
    labelKey: "universe.type.tee",
    aliases: ["tee", "tees", "t-shirt", "t-shirts", "tshirt", "تيشيرت", "تي شيرت"],
  },
  {
    key: "hoodie",
    labelKey: "universe.type.hoodie",
    aliases: ["hoodie", "hoodies", "hoody", "هودي"],
  },
  {
    key: "tracksuit",
    labelKey: "universe.type.tracksuit",
    aliases: [
      "tracksuit",
      "tracksuits",
      "track suit",
      "ensemble",
      "ensembles",
      "survêtement",
      "طقم رياضي",
      "بدلة رياضية",
    ],
  },
  {
    key: "sweatshirt",
    labelKey: "universe.type.sweatshirt",
    aliases: ["sweatshirt", "sweatshirts", "crewneck", "سويت شيرت"],
  },
  {
    key: "shirt",
    labelKey: "universe.type.shirt",
    aliases: ["shirt", "shirts", "chemise", "chemises", "قميص", "قمصان"],
  },
  {
    key: "pack",
    labelKey: "universe.type.pack",
    aliases: ["pack", "packs", "bundle", "set", "باقة", "باقات"],
  },
  { key: "other", labelKey: "universe.type.other", aliases: [] },
];

export type Vibe = { key: string; labelKey: TranslationKey; aliases: string[] };

export const VIBES: Vibe[] = [
  {
    key: "oversize",
    labelKey: "universe.vibe.oversize",
    aliases: ["oversize", "oversized", "أوفرسايز", "واسع"],
  },
  {
    key: "cars",
    labelKey: "universe.vibe.cars",
    aliases: ["cars", "car", "racing", "سيارات", "سيارة", "سباق"],
  },
  { key: "nyc", labelKey: "universe.vibe.nyc", aliases: ["nyc", "new york", "نيويورك"] },
  {
    key: "minimal",
    labelKey: "universe.vibe.minimal",
    aliases: ["minimal", "basic", "مينيمال", "بسيط"],
  },
  {
    key: "graphic",
    labelKey: "universe.vibe.graphic",
    aliases: ["graphic", "print", "printed", "جرافيك", "طبعة"],
  },
  {
    key: "urban",
    labelKey: "universe.vibe.urban",
    aliases: ["urban", "street", "streetwear", "حضري", "ستريت"],
  },
  {
    key: "vintage",
    labelKey: "universe.vibe.vintage",
    aliases: ["vintage", "retro", "فينتاج", "ريترو"],
  },
];

export function labelFor(item: Named, locale: Locale): string {
  if (locale === "ar") return item.ar;
  if (locale === "fr") return item.fr;
  return item.en;
}

/** Lowercase, strip accents and Arabic diacritics, collapse punctuation. */
export function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[ً-ْٰـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** Whole-word match for Latin tokens, substring for Arabic phrases. */
export function hasAlias(haystack: string, alias: string): boolean {
  const needle = normalize(alias);
  if (!needle) return false;
  if (/^[a-z0-9 ]+$/.test(needle) && !needle.includes(" ")) {
    return new RegExp(`(^|[^a-z0-9])${needle}([^a-z0-9]|$)`).test(haystack);
  }
  return haystack.includes(needle);
}
