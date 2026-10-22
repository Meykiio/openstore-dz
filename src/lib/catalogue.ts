import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query";
import { getSupabase } from "./supabase/client";
import type { CatalogueProduct } from "./queries";

/**
 * Catalogue browsing: filtering, sorting, search and paging.
 *
 * All of it happens in the database, in one call. It used to happen here, over the
 * whole catalogue, which was a deliberate choice for a shop with tens of products
 * and stopped being viable the moment the list was paged: filtering a page in the
 * browser only ever sees that page, so a result count becomes a wrong answer
 * rather than a slow one.
 *
 * The Arabic normalisation that used to live here now lives in
 * `normalize_arabic()` in the schema, for the same reason. One implementation, on
 * the side that has the whole set.
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
 * Products per page.
 *
 * Twelve, which is three rows of four on a desktop and six rows of two on a phone.
 * Small enough that a page arrives quickly on mobile data, large enough that
 * browsing does not become a series of single rows.
 */
const CATALOGUE_PAGE_SIZE = 12;

type CatalogueFacets = {
  sizes: string[];
  colors: string[];
  priceMin: number;
  priceMax: number;
};

export type CataloguePage = {
  products: CatalogueProduct[];
  total: number;
  pageCount: number;
  facets: CatalogueFacets;
};

/** The shape `catalogue_page()` returns, before the page count is derived. */
type CatalogueResponse = {
  total: number;
  products: CatalogueProduct[];
  facets: CatalogueFacets;
};

async function fetchCataloguePage(filters: CatalogueFilters, page: number): Promise<CataloguePage> {
  const { data, error } = await getSupabase().rpc("catalogue_page", {
    p_category_slug: filters.categorySlug,
    p_query: filters.query.trim() || null,
    p_sizes: filters.sizes.length > 0 ? filters.sizes : null,
    p_colors: filters.colors.length > 0 ? filters.colors : null,
    p_min_price: filters.minPrice,
    p_max_price: filters.maxPrice,
    p_in_stock: filters.inStockOnly,
    p_sort: filters.sort,
    p_limit: CATALOGUE_PAGE_SIZE,
    p_offset: (Math.max(page, 1) - 1) * CATALOGUE_PAGE_SIZE,
  });

  if (error) throw new Error(error.message);
  const response = (data ?? { total: 0, products: [], facets: EMPTY_FACETS }) as CatalogueResponse;

  return {
    products: response.products ?? [],
    total: response.total ?? 0,
    pageCount: Math.max(1, Math.ceil((response.total ?? 0) / CATALOGUE_PAGE_SIZE)),
    facets: response.facets ?? EMPTY_FACETS,
  };
}

const EMPTY_FACETS: CatalogueFacets = { sizes: [], colors: [], priceMin: 0, priceMax: 0 };

/**
 * Exported so a route loader can prefetch a page during SSR.
 *
 * Without this the grid renders empty in the server HTML and fills in from the
 * browser, which costs the first paint, the crawler, and anyone on a slow
 * connection. The loader and the component must build the same key, so they must
 * build it from the same function.
 */
export const cataloguePageQuery = (filters: CatalogueFilters, page: number) =>
  queryOptions({
    queryKey: ["catalogue", filters, page] as const,
    queryFn: () => fetchCataloguePage(filters, page),
    // Keeps the current page on screen while the next loads, so paging does not
    // flash a skeleton over products the buyer is already looking at.
    placeholderData: keepPreviousData,
  });

export function useCataloguePage(filters: CatalogueFilters, page: number) {
  return useQuery(cataloguePageQuery(filters, page));
}

/** Which filters are actually narrowing the list, so the UI can show a count. */
export function activeFilterCount(filters: CatalogueFilters): number {
  let count = filters.sizes.length + filters.colors.length;
  if (filters.categorySlug) count += 1;
  if (filters.inStockOnly) count += 1;
  if (filters.minPrice !== null || filters.maxPrice !== null) count += 1;
  return count;
}
