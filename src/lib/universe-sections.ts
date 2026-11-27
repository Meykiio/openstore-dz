import type { Locale, TranslationKey } from "./i18n";
import { ALGERIA_THEMES } from "./universe-algeria";
import { CLUBS } from "./universe-clubs";
import { SERIES } from "./universe-series";
import { labelFor, type Named } from "./universe-taxonomy";

/**
 * The declared shape of the four universes.
 *
 * The shop's structure is a decision, not a consequence of what happens to be
 * in stock: Anime has five series and "Other anime", Football has European and
 * Algerian clubs, Streetwear has its eight shelves. Declaring the shelves here
 * means an empty one still exists, with a count of zero and a clean empty state,
 * instead of vanishing until the first product arrives.
 *
 * Nothing here is a database row. A shelf is matched against the text a product
 * already carries, so a piece can sit on several shelves at once without a
 * second category column.
 */

export type UniverseKey = "anime" | "streetwear" | "algeria" | "football";

export type EntryMatch =
  | { kind: "series"; key: string }
  | { kind: "club"; key: string }
  | { kind: "theme"; key: string }
  | { kind: "type"; key: string }
  | { kind: "vibe"; key: string }
  | { kind: "category"; slug: string }
  | { kind: "other-series"; keys: string[] }
  | { kind: "other-club"; region: "algeria" | "europe"; keys: string[] };

export type SectionEntry = {
  /** Selection id, also the value kept in component state. */
  id: string;
  labelKey?: TranslationKey;
  /** Series and clubs carry their own Arabic/French/English labels. */
  named?: Named;
  any?: EntryMatch[];
  all?: EntryMatch[];
};

export type UniverseSection = {
  id: string;
  labelKey: TranslationKey;
  layout: "chips" | "clubs";
  entries: SectionEntry[];
};

const SERIES_BY_KEY = new Map(SERIES.map((series) => [series.key, series]));
const CLUB_BY_KEY = new Map(CLUBS.map((club) => [club.key, club]));
const THEME_BY_KEY = new Map(ALGERIA_THEMES.map((theme) => [theme.key, theme]));

const seriesEntry = (key: string): SectionEntry => ({
  id: `series:${key}`,
  named: SERIES_BY_KEY.get(key),
  any: [{ kind: "series", key }],
});

const clubEntry = (key: string): SectionEntry => ({
  id: `club:${key}`,
  named: CLUB_BY_KEY.get(key),
  any: [{ kind: "club", key }],
});

const themeEntry = (key: string): SectionEntry => ({
  id: `theme:${key}`,
  named: THEME_BY_KEY.get(key),
  any: [{ kind: "theme", key }],
});

const typeEntry = (key: string, labelKey: TranslationKey): SectionEntry => ({
  id: `type:${key}`,
  labelKey,
  any: [{ kind: "type", key }],
});

const categoryEntry = (slug: string, labelKey: TranslationKey): SectionEntry => ({
  id: `category:${slug}`,
  labelKey,
  any: [{ kind: "category", slug }],
});

/**
 * The nine Anime collections, in the order the storefront presents them.
 * Everything else is "Other anime". The Anime page draws these as cards, and
 * `/anime/$series` only accepts a key from this list.
 */
export const ANIME_COLLECTIONS = [
  "attack-on-titan",
  "blue-lock",
  "dandadan",
  "demon-slayer",
  "dragon-ball",
  "hunter-x-hunter",
  "jujutsu-kaisen",
  "naruto",
  "one-piece",
] as const;

export function isAnimeCollection(key: string): boolean {
  return (ANIME_COLLECTIONS as readonly string[]).includes(key);
}

/** The five clubs per region the brief promotes; the rest are "Other clubs". */
const PRIMARY_CLUBS = {
  europe: ["barcelona", "real-madrid", "man-city", "liverpool", "psg"],
  algeria: ["jsk", "mca", "usma", "usm-annaba", "crb"],
};

export const UNIVERSE_SECTIONS: Record<UniverseKey, UniverseSection[]> = {
  anime: [
    {
      id: "series",
      labelKey: "universe.series",
      layout: "chips",
      entries: [
        ...ANIME_COLLECTIONS.map(seriesEntry),
        {
          id: "series:other",
          labelKey: "universe.otherAnime",
          any: [{ kind: "other-series", keys: [...ANIME_COLLECTIONS] }],
        },
      ],
    },
  ],
  algeria: [
    {
      id: "themes",
      labelKey: "universe.algeriaThemes",
      layout: "chips",
      entries: ALGERIA_THEMES.map((theme) => themeEntry(theme.key)),
    },
    {
      id: "types",
      labelKey: "universe.types",
      layout: "chips",
      entries: [
        typeEntry("tee", "universe.type.tee"),
        typeEntry("hoodie", "universe.type.hoodie"),
        typeEntry("tracksuit", "universe.type.tracksuit"),
        typeEntry("sweatshirt", "universe.type.sweatshirt"),
      ],
    },
  ],
  streetwear: [
    {
      id: "collections",
      labelKey: "home.collections.title",
      layout: "chips",
      entries: [
        {
          id: "type:tee",
          labelKey: "universe.type.tee",
          all: [
            { kind: "type", key: "tee" },
            { kind: "vibe", key: "oversize" },
          ],
        },
        typeEntry("hoodie", "universe.type.hoodie"),
        {
          id: "vibe:cars",
          labelKey: "universe.vibe.cars",
          any: [{ kind: "vibe", key: "cars" }],
        },
        { id: "vibe:nyc", labelKey: "universe.vibe.nyc", any: [{ kind: "vibe", key: "nyc" }] },
        {
          id: "vibe:minimal-urban",
          labelKey: "universe.vibe.minimalUrban",
          any: [
            { kind: "vibe", key: "minimal" },
            { kind: "vibe", key: "urban" },
          ],
        },
        categoryEntry("polos", "universe.cat.polos"),
        categoryEntry("shorts", "universe.cat.shorts"),
        categoryEntry("bags", "universe.cat.accessories"),
      ],
    },
  ],
  football: [
    {
      id: "clubs-europe",
      labelKey: "universe.clubsEurope",
      layout: "clubs",
      entries: [
        ...PRIMARY_CLUBS.europe.map(clubEntry),
        {
          id: "club:other-europe",
          labelKey: "universe.otherClubs",
          any: [{ kind: "other-club", region: "europe", keys: PRIMARY_CLUBS.europe }],
        },
      ],
    },
    {
      id: "clubs-algeria",
      labelKey: "universe.clubsAlgeria",
      layout: "clubs",
      entries: [
        ...PRIMARY_CLUBS.algeria.map(clubEntry),
        {
          id: "club:other-algeria",
          labelKey: "universe.otherClubs",
          any: [{ kind: "other-club", region: "algeria", keys: PRIMARY_CLUBS.algeria }],
        },
      ],
    },
    {
      id: "types",
      labelKey: "universe.types",
      layout: "chips",
      entries: [
        typeEntry("tee", "universe.type.tee"),
        typeEntry("hoodie", "universe.type.hoodie"),
        typeEntry("tracksuit", "universe.type.tracksuit"),
        typeEntry("sweatshirt", "universe.type.sweatshirt"),
      ],
    },
  ],
};

/** The label a shelf shows: series and clubs carry their own, the rest a key. */
export function entryLabel(
  entry: SectionEntry,
  locale: Locale,
  t: (key: TranslationKey) => string,
): string {
  if (entry.named) return labelFor(entry.named, locale);
  if (entry.labelKey) return t(entry.labelKey);
  return entry.id;
}
