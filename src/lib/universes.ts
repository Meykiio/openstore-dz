import type { CatalogueProduct } from "./queries";
import type { TranslationKey } from "./i18n";
import { CLUBS } from "./universe-clubs";
import { productFacets, type ProductFacets } from "./product-facets";
import {
  UNIVERSE_SECTIONS,
  type EntryMatch,
  type SectionEntry,
  type UniverseKey,
  type UniverseSection,
} from "./universe-sections";

export type { UniverseKey };
export { productFacets };

/**
 * Universe membership and assembly.
 *
 * The classification lives in `product-facets.ts`; this file declares the four
 * universes, the order they are presented in, and how one universe's catalogue
 * is counted and assembled from the shelves in `universe-sections.ts`.
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
    key: "algeria",
    to: "/algeria-design",
    accent: "#3ee08a",
    index: "03",
    labelKey: "home.universe.algeria",
    kickerKey: "universe.algeria.kicker",
    titleKey: "universe.algeria.title",
    bodyKey: "home.universe.algeria.body",
    introKey: "universe.algeria.intro",
    ctaKey: "universe.algeria.enter",
  },
  {
    key: "football",
    to: "/football",
    accent: "#ff6a3d",
    index: "04",
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

const CLUB_REGION = new Map(CLUBS.map((club) => [club.key, club.region]));

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
    case "theme":
      return facets.themes.includes(match.key);
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

export function universesOf(product: CatalogueProduct): UniverseKey[] {
  return productFacets(product).universes;
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
