import { queryOptions, useQuery } from "@tanstack/react-query";
import { getSupabase } from "./supabase/client";
import { slugify } from "./format";

/**
 * Category management for the owner.
 *
 * Reads every category, hidden ones included, which only an administrator's RLS
 * policy allows. The storefront's `useCategories` reads active ones only, so
 * both caches are dropped after any write here.
 */
export type AdminCategory = {
  id: string;
  slug: string;
  name: string;
  name_fr: string | null;
  sort_order: number;
  is_active: boolean;
  product_count: number;
};

type Row = Omit<AdminCategory, "product_count"> & { products: { count: number }[] };

async function fetchAdminCategories(): Promise<AdminCategory[]> {
  const { data, error } = await getSupabase()
    .from("categories")
    .select("id, slug, name, name_fr, sort_order, is_active, products(count)")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as Row[]).map(({ products, ...category }) => ({
    ...category,
    product_count: products[0]?.count ?? 0,
  }));
}

export const ADMIN_CATEGORIES_KEY = ["admin_categories"] as const;

export function useAdminCategories() {
  return useQuery(queryOptions({ queryKey: ADMIN_CATEGORIES_KEY, queryFn: fetchAdminCategories }));
}

/**
 * A slug from the Latin name if there is one: an Arabic slug works but is
 * shared as an unreadable run of percent-escapes. A short random tail resolves
 * a clash with an existing slug.
 */
function slugFor(name: string, nameFr: string | null, attempt: number): string {
  const base = slugify(nameFr ?? "") || slugify(name) || "category";
  return attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function createCategory(input: {
  name: string;
  name_fr: string | null;
  sort_order: number;
}): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { error } = await getSupabase()
      .from("categories")
      .insert({ ...input, slug: slugFor(input.name, input.name_fr, attempt) });
    if (!error) return;
    // 23505 is a unique violation: the slug is taken, so try a suffixed one.
    if (error.code !== "23505") throw new Error(error.message);
  }
  throw new Error("Could not find a free web address for this category. Try another name.");
}

export async function updateCategory(
  id: string,
  patch: Partial<Pick<AdminCategory, "name" | "name_fr" | "sort_order" | "is_active">>,
): Promise<void> {
  const { error } = await getSupabase().from("categories").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

/** Products in a deleted category become uncategorised, not deleted. */
export async function deleteCategory(id: string): Promise<void> {
  const { error } = await getSupabase().from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
