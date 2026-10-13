import { sortVariants, type CatalogueProduct } from "./queries";

/**
 * Catalogue filtering, sorting and search.
 *
 * Runs in the browser over the already-loaded catalogue rather than as a query
 * per keystroke. That is a deliberate choice for this scale: a single Algerian
 * shop typically carries tens to a couple of hundred products, and the whole
 * catalogue is already fetched for the home page. Filtering in memory makes
 * every filter change instant with no round trip, which on a 3G connection is
 * the difference between a shop that feels responsive and one that does not.
 *
 * The threshold where this stops being true is roughly a few hundred products,
 * at which point the whole-catalogue fetch becomes the payload problem rather
 * than the filtering. At that point this module is the thing to replace with a
 * server-side query, and the signatures below are designed so that swap is a
 * change of implementation, not of callers.
 */

export type SortKey = "newest" | "price-asc" | "price-desc" | "name";

export type CatalogueFilters = {
  query: string;
  categorySlug: string | null;
  sizes: string[];
  colors: string[];
  minPrice: number | null;
  maxPrice: number | null;
  inStockOnly: boolean;
  sort: SortKey;
};

export const EMPTY_FILTERS: CatalogueFilters = {
  query: "",
  categorySlug: null,
  sizes: [],
  colors: [],
  minPrice: null,
  maxPrice: null,
  inStockOnly: false,
  sort: "newest",
};

/**
 * Fold the spelling variation Arabic actually has.
 *
 * A buyer typing "قميص" must find "قَميص", and someone typing "احمد" must match
 * "أحمد". Hamza forms, the two ya forms and the taa marbuta are all written
 * interchangeably on phones, which is where most of this traffic comes from.
 * Diacritics are stripped because nobody types them.
 */
export function normalizeArabic(input: string): string {
  return input
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[ؤئ]/g, "ء")
    .replace(/\s+/g, " ")
    .trim();
}

/** Cheapest and dearest active variant, the range a card should show. */
function productPrice(product: CatalogueProduct): { min: number; max: number } | null {
  const variants = sortVariants(product.product_variants);
  if (variants.length === 0) return null;
  const prices = variants.map((v) => v.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

/** Every distinct size and colour the catalogue offers, for the filter UI. */
export function facetsFor(products: CatalogueProduct[]): {
  sizes: string[];
  colors: string[];
  priceMin: number;
  priceMax: number;
} {
  const sizes = new Set<string>();
  const colors = new Set<string>();
  let priceMin = Number.POSITIVE_INFINITY;
  let priceMax = 0;

  for (const product of products) {
    for (const variant of sortVariants(product.product_variants)) {
      if (variant.size) sizes.add(variant.size);
      if (variant.color_name) colors.add(variant.color_name);
      priceMin = Math.min(priceMin, variant.price);
      priceMax = Math.max(priceMax, variant.price);
    }
  }

  return {
    sizes: [...sizes].sort((a, b) => a.localeCompare(b, "ar")),
    colors: [...colors].sort((a, b) => a.localeCompare(b, "ar")),
    priceMin: Number.isFinite(priceMin) ? priceMin : 0,
    priceMax,
  };
}

function matchesQuery(product: CatalogueProduct, needle: string): boolean {
  if (!needle) return true;
  const haystack = normalizeArabic(
    [product.name, product.name_fr ?? "", product.description ?? "", product.slug]
      .join(" ")
      .concat(
        " ",
        product.product_variants
          .map((v) => [v.sku ?? "", v.size ?? "", v.color_name ?? ""].join(" "))
          .join(" "),
      ),
  );
  // Every word must appear, so "قميص ابيض" narrows rather than widens.
  return needle.split(" ").every((word) => haystack.includes(word));
}

function matchesVariants(product: CatalogueProduct, filters: CatalogueFilters): boolean {
  const variants = sortVariants(product.product_variants).filter((variant) => {
    if (filters.inStockOnly && variant.stock <= 0) return false;
    if (filters.sizes.length > 0 && (!variant.size || !filters.sizes.includes(variant.size))) {
      return false;
    }
    if (
      filters.colors.length > 0 &&
      (!variant.color_name || !filters.colors.includes(variant.color_name))
    ) {
      return false;
    }
    if (filters.minPrice !== null && variant.price < filters.minPrice) return false;
    if (filters.maxPrice !== null && variant.price > filters.maxPrice) return false;
    return true;
  });
  return variants.length > 0;
}

const SORTERS: Record<SortKey, (a: CatalogueProduct, b: CatalogueProduct) => number> = {
  newest: (a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""),
  name: (a, b) => a.name.localeCompare(b.name, "ar"),
  "price-asc": (a, b) => (productPrice(a)?.min ?? 0) - (productPrice(b)?.min ?? 0),
  "price-desc": (a, b) => (productPrice(b)?.max ?? 0) - (productPrice(a)?.max ?? 0),
};

export function applyCatalogueFilters(
  products: CatalogueProduct[],
  filters: CatalogueFilters,
): CatalogueProduct[] {
  const needle = normalizeArabic(filters.query);

  const matched = products.filter((product) => {
    if (filters.categorySlug && product.categories?.slug !== filters.categorySlug) return false;
    if (!matchesQuery(product, needle)) return false;
    if (!matchesVariants(product, filters)) return false;
    return true;
  });

  return matched.sort(SORTERS[filters.sort]);
}

/** Which filters are actually narrowing the list, so the UI can show a count. */
export function activeFilterCount(filters: CatalogueFilters): number {
  let count = filters.sizes.length + filters.colors.length;
  if (filters.categorySlug) count += 1;
  if (filters.inStockOnly) count += 1;
  if (filters.minPrice !== null || filters.maxPrice !== null) count += 1;
  return count;
}
