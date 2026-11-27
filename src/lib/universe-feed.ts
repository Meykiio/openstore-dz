import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query";
import { getSupabase } from "./supabase/client";
import type { CatalogueProduct } from "./queries";

/**
 * One feed for the universe pages.
 *
 * `catalogue_page` filters one category and some text, not a derived universe,
 * so the universe is applied in the browser. 96 is enough for the seeded
 * catalogue and a small shop; a shop that grows past it can add a database facet
 * without changing the page's contract.
 */
const UNIVERSE_FEED_SIZE = 96;

async function fetchUniverseFeed(): Promise<CatalogueProduct[]> {
  const { data, error } = await getSupabase().rpc("catalogue_page", {
    p_category_slug: null,
    p_query: null,
    p_sizes: null,
    p_colors: null,
    p_min_price: null,
    p_max_price: null,
    p_in_stock: false,
    p_sort: "newest",
    p_limit: UNIVERSE_FEED_SIZE,
    p_offset: 0,
  });
  if (error) throw new Error(error.message);
  return ((data ?? {}) as { products?: CatalogueProduct[] }).products ?? [];
}

export const universeFeedQuery = () =>
  queryOptions({
    queryKey: ["universe-feed"] as const,
    queryFn: fetchUniverseFeed,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

export function useUniverseFeed() {
  return useQuery(universeFeedQuery());
}
