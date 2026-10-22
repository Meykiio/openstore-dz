import { queryOptions, useQuery } from "@tanstack/react-query";
import { getSupabase } from "./supabase/client";

/**
 * Size guides.
 *
 * A guide with `product_id = null` applies to the whole store; one with a
 * product id applies to that product only. Both are returned together so a
 * product page can show the specific guide and fall back to the general one
 * without a second round trip.
 */
export type SizeGuide = {
  id: string;
  product_id: string | null;
  name: string;
  headers: string[];
  rows: string[][];
  note: string | null;
  note_fr: string | null;
  sort_order: number;
};

async function fetchSizeGuides(productId: string): Promise<SizeGuide[]> {
  const { data, error } = await getSupabase()
    .from("size_guides")
    .select("id, product_id, name, headers, rows, note, note_fr, sort_order")
    .or(`product_id.eq.${productId},product_id.is.null`)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(normalise);
}

/** `rows` is jsonb, so guard the shape rather than trusting it. */
function normalise(raw: Record<string, unknown>): SizeGuide {
  const rows = Array.isArray(raw.rows)
    ? (raw.rows as unknown[])
        .filter((row): row is unknown[] => Array.isArray(row))
        .map((row) => row.map((cell) => String(cell ?? "")))
    : [];
  return {
    id: String(raw.id),
    product_id: (raw.product_id as string | null) ?? null,
    name: String(raw.name ?? ""),
    headers: Array.isArray(raw.headers) ? (raw.headers as string[]).map(String) : [],
    rows,
    note: (raw.note as string | null) ?? null,
    note_fr: (raw.note_fr as string | null) ?? null,
    sort_order: Number(raw.sort_order ?? 0),
  };
}

export const sizeGuidesQuery = (productId: string) =>
  queryOptions({
    queryKey: ["size_guides", productId] as const,
    queryFn: () => fetchSizeGuides(productId),
    enabled: Boolean(productId),
  });

export function useSizeGuides(productId: string) {
  return useQuery(sizeGuidesQuery(productId));
}

/** Product-specific guide wins over the store-wide one. */
export function pickGuide(guides: SizeGuide[], productId: string): SizeGuide | null {
  return (
    guides.find((g) => g.product_id === productId) ?? guides.find((g) => !g.product_id) ?? null
  );
}
