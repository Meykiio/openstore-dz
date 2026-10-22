import { getSupabase } from "./supabase/client";

/**
 * Content administration that is not a plain product field: what is inside a
 * pack, and a product's size guide.
 *
 * Both are edited whole. A size guide is a small table that only makes sense as
 * a unit, and a pack's contents are a short list, so there is no reason to
 * expose per-cell writes.
 */

export type PackItem = {
  id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  sort_order: number;
};

export async function fetchPackItems(productId: string): Promise<PackItem[]> {
  const { data, error } = await getSupabase()
    .from("pack_items")
    .select("id, product_id, variant_id, quantity, sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as PackItem[];
}

export async function upsertPackItem(input: {
  product_id: string;
  variant_id: string;
  quantity: number;
  sort_order: number;
}): Promise<void> {
  const { error } = await getSupabase()
    .from("pack_items")
    .upsert(input, { onConflict: "product_id,variant_id" });
  if (error) throw new Error(error.message);
}

export async function removePackItem(id: string): Promise<void> {
  const { error } = await getSupabase().from("pack_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export type SizeGuideRow = {
  id: string;
  product_id: string | null;
  name: string;
  headers: string[];
  rows: string[][];
  note: string | null;
  note_fr: string | null;
  sort_order: number;
};

/**
 * Save a guide for a product. `product_id` null makes it the store-wide guide,
 * which every product without its own falls back to.
 */
export async function saveSizeGuide(input: {
  id?: string;
  product_id: string | null;
  name: string;
  headers: string[];
  rows: string[][];
  note: string | null;
  note_fr: string | null;
}): Promise<void> {
  const { error } = await getSupabase()
    .from("size_guides")
    .upsert(
      {
        id: input.id,
        product_id: input.product_id,
        name: input.name,
        headers: input.headers,
        rows: input.rows,
        note: input.note,
        note_fr: input.note_fr,
      },
      input.id ? { onConflict: "id" } : undefined,
    );
  if (error) throw new Error(error.message);
}

export async function deleteSizeGuide(id: string): Promise<void> {
  const { error } = await getSupabase().from("size_guides").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * Parse a pasted table.
 *
 * Accepts tab- or comma-separated lines, which is what a shop owner actually has
 * when copying measurements out of a spreadsheet. The first line becomes the
 * headers. Blank lines are ignored so a trailing newline is not a phantom row.
 */
export function parseGuideTable(text: string): { headers: string[]; rows: string[][] } {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };

  const split = (line: string) =>
    line.split(line.includes("\t") ? "\t" : ",").map((cell) => cell.trim());

  const [first, ...rest] = lines;
  return { headers: split(first), rows: rest.map(split) };
}

/** The size guide row for one product, or null when it has none yet. */
export async function fetchAdminSizeGuide(productId: string): Promise<SizeGuideRow | null> {
  const { data, error } = await getSupabase()
    .from("size_guides")
    .select("id, product_id, name, headers, rows, note, note_fr, sort_order")
    .eq("product_id", productId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const rows = Array.isArray(data.rows)
    ? (data.rows as unknown[])
        .filter((row): row is unknown[] => Array.isArray(row))
        .map((row) => row.map((cell) => String(cell ?? "")))
    : [];
  return {
    id: data.id,
    product_id: data.product_id,
    name: data.name,
    headers: (data.headers as string[]) ?? [],
    rows,
    note: data.note,
    note_fr: data.note_fr,
    sort_order: data.sort_order,
  };
}
