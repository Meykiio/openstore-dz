import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query";
import { getSupabase } from "./supabase/client";
import { slugify } from "./format";

/**
 * Product administration.
 *
 * Reads here intentionally bypass the storefront's `status = 'published'` filter
 * so drafts and archived products are visible to the owner. That is not a
 * privilege escalation: RLS grants the published rows to everyone and every row
 * only to a verified admin, so the same query returns different sets depending
 * on who runs it.
 */
export type AdminVariant = {
  id: string;
  product_id: string;
  size: string | null;
  color_name: string | null;
  color_hex: string | null;
  sku: string | null;
  price: number;
  compare_at_price?: number | null;
  stock: number;
  weight_grams: number | null;
  sort_order: number;
  is_active: boolean;
  variant_images: { id: string; url: string; alt: string | null; sort_order: number }[];
};

export type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  name_fr: string | null;
  description: string | null;
  description_fr: string | null;
  kind: "single" | "pack";
  status: string;
  category_id: string | null;
  /** Joined for display; the admin form edits category_id. */
  categories: { slug: string; name: string } | null;
  published_at: string | null;
  created_at: string;
  product_variants: AdminVariant[];
};

const ADMIN_SELECT = `
  id, slug, name, name_fr, description, description_fr, kind, status, category_id,
  published_at, created_at,
  categories ( slug, name ),
  product_variants (
    id, product_id, size, color_name, color_hex, sku, price, compare_at_price, stock,
    weight_grams, sort_order, is_active,
    variant_images ( id, url, alt, sort_order )
  )
`;

/*
 * Products per page. Fifteen, same reasoning as the order queue: a page that has to
 * be scrolled to reach the bottom is a page whose last rows get skimmed past.
 */
const PRODUCTS_PAGE_SIZE = 15;

/** One page of products, plus what is needed to ask for the next one. */
type AdminProductsPage = {
  rows: AdminProduct[];
  total: number;
  pageCount: number;
};

/*
 * A page of products, newest first.
 *
 * Unbounded before, which was worse than it looks: each row carries its variants
 * and each variant its images, so the list fetched the whole catalogue with
 * everything nested on every visit. Paging bounds the payload, not just the rows.
 *
 * Ordered by `created_at` then `id`, the same tiebreaker the order list uses:
 * `created_at` is not unique, and without a stable second key rows repeat or
 * vanish between pages.
 */
async function fetchAdminProductsPage(page: number): Promise<AdminProductsPage> {
  const from = (Math.max(page, 1) - 1) * PRODUCTS_PAGE_SIZE;
  const { data, error, count } = await getSupabase()
    .from("products")
    .select(ADMIN_SELECT, { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, from + PRODUCTS_PAGE_SIZE - 1);
  if (error) throw new Error(error.message);

  const total = count ?? 0;
  return {
    rows: (data ?? []) as unknown as AdminProduct[],
    total,
    pageCount: Math.max(1, Math.ceil(total / PRODUCTS_PAGE_SIZE)),
  };
}

export function useAdminProductsPage(page: number) {
  return useQuery({
    queryKey: ["admin_products", page] as const,
    queryFn: () => fetchAdminProductsPage(page),
    // Keeps the current page visible while the next loads.
    placeholderData: keepPreviousData,
  });
}

async function fetchAdminProduct(id: string): Promise<AdminProduct | null> {
  const { data, error } = await getSupabase()
    .from("products")
    .select(ADMIN_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as unknown as AdminProduct | null) ?? null;
}

const adminProductQuery = (id: string) =>
  queryOptions({
    queryKey: ["admin_product", id] as const,
    queryFn: () => fetchAdminProduct(id),
    enabled: Boolean(id),
  });

export function useAdminProduct(id: string) {
  return useQuery(adminProductQuery(id));
}

/** Suggest a slug from a name, never overwriting one the owner already set. */
export function suggestSlug(name: string): string {
  return slugify(name) || `product-${Date.now()}`;
}

export async function createProduct(input: {
  name: string;
  slug: string;
  kind: "single" | "pack";
  category_id?: string | null;
}): Promise<string> {
  const { data, error } = await getSupabase()
    .from("products")
    .insert({
      name: input.name.trim(),
      slug: input.slug.trim(),
      kind: input.kind,
      category_id: input.category_id ?? null,
      status: "draft",
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function updateProduct(
  id: string,
  patch: Partial<
    Pick<
      AdminProduct,
      | "name"
      | "name_fr"
      | "description"
      | "description_fr"
      | "category_id"
      | "status"
      | "published_at"
    >
  >,
): Promise<void> {
  const { error } = await getSupabase().from("products").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * Publish or unpublish. `published_at` is stamped on first publish only, so
 * republishing does not reorder the storefront.
 */
export async function setProductStatus(
  id: string,
  status: "draft" | "published" | "archived",
  hasPublishedAt: boolean,
): Promise<void> {
  await updateProduct(id, {
    status,
    ...(status === "published" && !hasPublishedAt
      ? { published_at: new Date().toISOString() }
      : {}),
  });
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await getSupabase().from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export type VariantInput = {
  id?: string;
  product_id: string;
  size: string | null;
  color_name: string | null;
  color_hex: string | null;
  sku: string | null;
  price: number;
  compare_at_price?: number | null;
  stock: number;
  weight_grams: number | null;
  sort_order: number;
  is_active: boolean;
};

export async function upsertVariant(input: VariantInput): Promise<void> {
  const { error } = await getSupabase()
    .from("product_variants")
    .upsert(input, input.id ? { onConflict: "id" } : undefined);
  if (error) throw new Error(error.message);
}

/** Many variants in one request, for the colour × size generator. */
export async function insertVariants(
  productId: string,
  rows: Omit<VariantInput, "product_id" | "weight_grams">[],
): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await getSupabase()
    .from("product_variants")
    .insert(rows.map((row) => ({ ...row, product_id: productId })));
  if (error) throw new Error(error.message);
}

export async function deleteVariant(id: string): Promise<void> {
  const { error } = await getSupabase().from("product_variants").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function addVariantImage(variantId: string, url: string): Promise<void> {
  const { error } = await getSupabase()
    .from("variant_images")
    .insert({ variant_id: variantId, url: url.trim() });
  if (error) throw new Error(error.message);
}

export async function deleteVariantImage(id: string): Promise<void> {
  const { error } = await getSupabase().from("variant_images").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
