import type { CatalogueProduct } from "./queries";
import type { TranslationKey } from "./i18n";
import { CLUBS } from "./universe-clubs";
import { SERIES } from "./universe-series";
import { PIECE_TYPES, VIBES, hasAlias, normalize } from "./universe-taxonomy";
import {
  UNIVERSE_SECTIONS,
  type EntryMatch,
  type SectionEntry,
  type UniverseKey,
  type UniverseSection,
} from "./universe-sections";

export type { UniverseKey };

/**
 * Universe membership, derived from the catalogue the shop already has.
 *
 * A product carries a name, a description, a category and variants. That is
 * enough to file a "Barcelona 1999 hoodie" under Football -> Barcelona without a
 * second taxonomy, a migration or invented catalogue rows. The rules are
 * intentionally generous: a piece that mentions nothing specific belongs to
 * Streetwear, because that is the shop's general fashion floor.
 *
 * The shelves themselves are declared in `universe-sections.ts`; this file only
 * counts and matches against them.
 */

export type UniverseConfig = {
  key: UniverseKey;
  to: string;
  accent: string;
  index: string;
  labelKey: TranslationKey;
  kickerKey: TranslationKey;
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
  introKey: TranslationKey;
  ctaKey: TranslationKey;
};

export const UNIVERSES: readonly UniverseConfig[] = [
  {
    key: "anime",
    to: "/anime",
    accent: "#7ef0ff",
    index: "01",
    labelKey: "home.universe.anime",
    kickerKey: "universe.anime.kicker",
    titleKey: "universe.anime.title",
    bodyKey: "home.universe.anime.body",
    introKey: "universe.anime.intro",
    ctaKey: "universe.anime.enter",
  },
  {
    key: "streetwear",
    to: "/streetwear",
    accent: "#c9f000",
    index: "02",
    labelKey: "home.universe.streetwear",
    kickerKey: "universe.streetwear.kicker",
    titleKey: "universe.streetwear.title",
    bodyKey: "home.universe.streetwear.body",
    introKey: "universe.streetwear.intro",
    ctaKey: "universe.streetwear.enter",
  },
  {
    key: "football",
    to: "/football",
    accent: "#ff6a3d",
    index: "03",
    labelKey: "home.universe.football",
    kickerKey: "universe.football.kicker",
    titleKey: "universe.football.title",
    bodyKey: "home.universe.football.body",
    introKey: "universe.football.intro",
    ctaKey: "universe.football.enter",
  },
];

export function universeConfig(key: UniverseKey): UniverseConfig {
  return UNIVERSES.find((universe) => universe.key === key) ?? UNIVERSES[0];
}

export type ProductFacets = {
  universes: UniverseKey[];
  clubs: string[];
  series: string[];
  types: string[];
  vibes: string[];
};

const ANIME_WORDS = ["anime", "manga", "أنيمي", "انمي", "مانغا"];
const FOOTBALL_WORDS = ["football", "soccer", "jersey", "maillot", "كرة القدم", "foot"];
const CLUB_REGION = new Map(CLUBS.map((club) => [club.key, club.region]));

function textOf(product: CatalogueProduct): string {
  const variants = product.product_variants.flatMap((variant) => [
    variant.size,
    variant.color_name,
    variant.sku,
  ]);
  return normalize(
    [
      product.name,
      product.name_fr,
      product.description,
      product.description_fr,
      product.slug,
      product.categories?.name,
      product.categories?.name_fr,
      product.categories?.slug,
      ...variants,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

export function productFacets(product: CatalogueProduct): ProductFacets {
  const text = textOf(product);
  const clubs = CLUBS.filter((club) => club.aliases.some((alias) => hasAlias(text, alias)));
  const series = SERIES.filter((entry) => entry.aliases.some((alias) => hasAlias(text, alias)));

  const types = pieceTypesOf(text, product.kind);
  const vibes = vibeKeysOf(text);
  const anime = series.length > 0 || ANIME_WORDS.some((word) => hasAlias(text, word));
  const football = clubs.length > 0 || FOOTBALL_WORDS.some((word) => hasAlias(text, word));

  const universes: UniverseKey[] = [];
  if (anime) universes.push("anime");
  if (football) universes.push("football");
  if (!anime && !football) universes.push("streetwear");

  return {
    universes,
    clubs: clubs.map((club) => club.key),
    series: series.map((entry) => entry.key),
    types,
    vibes,
  };
}

/** Kept apart from `productFacets` only to keep both functions short. */
function pieceTypesOf(text: string, kind: "single" | "pack"): string[] {
  const matched = PIECE_TYPES.filter(
    (type) => type.key !== "other" && type.aliases.some((alias) => hasAlias(text, alias)),
  );
  if (matched.length > 0) return matched.map((type) => type.key);
  if (kind === "pack") return ["pack"];
  return ["other"];
}

function vibeKeysOf(text: string): string[] {
  return VIBES.filter((vibe) => vibe.aliases.some((alias) => hasAlias(text, alias))).map(
    (vibe) => vibe.key,
  );
}

export function universesOf(product: CatalogueProduct): UniverseKey[] {
  return productFacets(product).universes;
}

function selectorMatches(
  product: CatalogueProduct,
  facets: ProductFacets,
  match: EntryMatch,
): boolean {
  switch (match.kind) {
    case "series":
      return facets.series.includes(match.key);
    case "club":
      return facets.clubs.includes(match.key);
    case "type":
      return facets.types.includes(match.key);
    case "vibe":
      return facets.vibes.includes(match.key);
    case "category":
      return product.categories?.slug === match.slug;
    case "other-series":
      return (
        facets.series.some((key) => !match.keys.includes(key)) ||
        (facets.universes.includes("anime") && facets.series.length === 0)
      );
    case "other-club":
      return facets.clubs.some(
        (key) => CLUB_REGION.get(key) === match.region && !match.keys.includes(key),
      );
  }
}

/** Whether a product sits on one declared shelf. Empty shelves still exist. */
export function matchesEntry(
  product: CatalogueProduct,
  facets: ProductFacets,
  entry: SectionEntry,
): boolean {
  if (entry.all && !entry.all.every((match) => selectorMatches(product, facets, match))) {
    return false;
  }
  if (entry.any && entry.any.length > 0) {
    return entry.any.some((match) => selectorMatches(product, facets, match));
  }
  return Boolean(entry.all);
}

export type UniverseEntry = { entry: SectionEntry; count: number };
type UniverseSectionView = Omit<UniverseSection, "entries"> & {
  entries: UniverseEntry[];
};

export type UniverseCatalog = {
  members: CatalogueProduct[];
  sections: UniverseSectionView[];
};

export function buildUniverse(
  products: CatalogueProduct[],
  universe: UniverseKey,
): UniverseCatalog {
  const classified = products
    .map((product) => ({ product, facets: productFacets(product) }))
    .filter((entry) => entry.facets.universes.includes(universe));

  const sections = UNIVERSE_SECTIONS[universe].map((section) => ({
    ...section,
    entries: section.entries.map((entry) => ({
      entry,
      count: classified.filter((item) => matchesEntry(item.product, item.facets, entry)).length,
    })),
  }));

  return { members: classified.map((item) => item.product), sections };
}

/** The shelf a selection id points at, if it still exists in the structure. */
export function findEntry(catalog: UniverseCatalog, id: string): SectionEntry | null {
  for (const section of catalog.sections) {
    const match = section.entries.find((row) => row.entry.id === id);
    if (match) return match.entry;
  }
  return null;
}
