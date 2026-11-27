import type { CatalogueProduct } from "./queries";
import { ALGERIA_THEMES } from "./universe-algeria";
import { CLUBS } from "./universe-clubs";
import { SERIES } from "./universe-series";
import { PIECE_TYPES, VIBES, hasAlias, normalize } from "./universe-taxonomy";
import type { UniverseKey } from "./universe-sections";

/**
 * How a product is filed, derived from the catalogue the shop already has.
 *
 * A product carries a name, a description, a category and variants. That is
 * enough to file a "Barcelona 1999 hoodie" under Football without a second
 * taxonomy, a migration or invented catalogue rows. The owner can also steer
 * the filing from the admin: a product in the "Anime: Naruto" category lands on
 * the Naruto shelf even when its name says nothing, and the `algeria-design`
 * and `football-design` categories are honoured the same way.
 *
 * Exactly one universe per product, in the order Anime, Football, Algeria
 * Design, Streetwear: the first match wins, and a piece that mentions nothing
 * specific is Streetwear, the shop's general fashion floor. That keeps each
 * universe's catalogue clean instead of showing the same piece on several
 * shelves.
 */

export type ProductFacets = {
  universes: UniverseKey[];
  clubs: string[];
  series: string[];
  themes: string[];
  types: string[];
  vibes: string[];
};

const ANIME_WORDS = ["anime", "manga", "أنيمي", "انمي", "مانغا"];
const FOOTBALL_WORDS = ["football", "soccer", "jersey", "maillot", "كرة القدم", "foot"];
const ALGERIA_WORDS = [
  "algeria design",
  "algerie design",
  "dz design",
  "تصميم جزائري",
  "تصميم جزايري",
];

/** A category slug the admin uses to file a piece; the safest signal there is. */
const ANIME_CATEGORY = /^anime(-|$)/;
const SERIES_CATEGORY = /^anime-(.+)$/;

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

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function productFacets(product: CatalogueProduct): ProductFacets {
  const text = textOf(product);
  const categorySlug = product.categories?.slug ?? "";
  const seriesFromCategory = SERIES_CATEGORY.exec(categorySlug)?.[1];

  const series = unique([
    ...SERIES.filter((entry) => entry.aliases.some((alias) => hasAlias(text, alias))).map(
      (entry) => entry.key,
    ),
    ...(seriesFromCategory && SERIES.some((entry) => entry.key === seriesFromCategory)
      ? [seriesFromCategory]
      : []),
  ]);
  const clubs = CLUBS.filter((club) => club.aliases.some((alias) => hasAlias(text, alias))).map(
    (club) => club.key,
  );
  const themes = ALGERIA_THEMES.filter((theme) =>
    theme.aliases.some((alias) => hasAlias(text, alias)),
  ).map((theme) => theme.key);

  const types = pieceTypesOf(text, product.kind);
  const vibes = vibeKeysOf(text);

  const anime =
    series.length > 0 ||
    ANIME_CATEGORY.test(categorySlug) ||
    ANIME_WORDS.some((word) => hasAlias(text, word));
  const football =
    clubs.length > 0 ||
    categorySlug === "football-design" ||
    FOOTBALL_WORDS.some((word) => hasAlias(text, word));
  const algeria =
    themes.length > 0 ||
    categorySlug === "algeria-design" ||
    ALGERIA_WORDS.some((word) => hasAlias(text, word));

  const universes: UniverseKey[] = anime
    ? ["anime"]
    : football
      ? ["football"]
      : algeria
        ? ["algeria"]
        : ["streetwear"];

  return { universes, clubs, series, themes, types, vibes };
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
