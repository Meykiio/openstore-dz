import { queryOptions, useQuery } from "@tanstack/react-query";
import { getSupabase } from "./supabase/client";

// Re-exported so existing imports from "@/lib/queries" keep working. The
// implementation lives in ./store-settings, split out at the 250-line limit.
export { storeSettingsQuery, useStoreSettings, type StoreSettings } from "./store-settings";

/**
 * Public catalogue reads.
 *
 * Exposed as `queryOptions` rather than only hooks, so a route loader can
 * prefetch the same entry with the same key and render it during SSR. Sharing
 * the options object is what keeps the loader and the component from drifting
 * into two different caches.
 *
 * These run as the anonymous role and are filtered by RLS, not by this file. A
 * product only appears if its `status` is `published`, and its variants and
 * images only if the parent is. There is no client-side status filter to forget.
 */

type CatalogueImage = {
  id: string;
  url: string;
  alt: string | null;
  sort_order: number;
};

export type CatalogueVariant = {
  id: string;
  size: string | null;
  color_name: string | null;
  color_hex: string | null;
  sku: string | null;
  price: number;
  stock: number;
  is_active: boolean;
  sort_order: number;
  variant_images: CatalogueImage[];
};

type CatalogueCategory = {
  slug: string;
  name: string;
  name_fr: string | null;
};

export type CatalogueProduct = {
  id: string;
  slug: string;
  name: string;
  name_fr: string | null;
  description: string | null;
  description_fr: string | null;
  kind: "single" | "pack";
  status: string;
  category_id: string | null;
  /** The joined category, or null when the product is uncategorised. */
  categories: CatalogueCategory | null;
  published_at: string | null;
  product_variants: CatalogueVariant[];
};

/** A category with the number of published products in it. */
type CategoryWithCount = {
  id: string;
  slug: string;
  name: string;
  name_fr: string | null;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  product_count: number;
};

export type PublicReview = {
  id: string;
  product_id: string | null;
  customer_name: string;
  rating: number;
  comment: string;
  image_url: string | null;
  created_at: string;
};

const PRODUCT_SELECT = `
  id, slug, name, name_fr, description, description_fr, kind, status, category_id, published_at,
  categories ( slug, name, name_fr ),
  product_variants (
    id, size, color_name, color_hex, sku, price, stock, is_active, sort_order,
    variant_images ( id, url, alt, sort_order )
  )
`;

async function fetchProducts(): Promise<CatalogueProduct[]> {
  const { data, error } = await getSupabase()
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("status", "published")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as CatalogueProduct[];
}

async function fetchProduct(slug: string): Promise<CatalogueProduct | null> {
  const { data, error } = await getSupabase()
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as unknown as CatalogueProduct | null) ?? null;
}

async function fetchReviews(productId?: string): Promise<PublicReview[]> {
  let query = getSupabase()
    .from("reviews")
    .select("id, product_id, customer_name, rating, comment, image_url, created_at")
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(50);
  if (productId) query = query.eq("product_id", productId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as PublicReview[];
}

/**
 * Active categories with their published-product count.
 *
 * Counted in a separate read rather than a PostgREST aggregate, so the
 * `status` rule lives in one place instead of being repeated in a query string.
 */
/**
 * Active categories with their published-product count.
 *
 * The count comes from a database aggregate, not from fetching every product to
 * count in the browser. The earlier version did that, so the home page pulled the
 * whole catalogue on every load to produce eight numbers.
 */
async function fetchCategories(): Promise<CategoryWithCount[]> {
  const supabase = getSupabase();

  const [{ data: rows, error }, { data: counts, error: countError }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, slug, name, name_fr, description, image_url, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase.rpc("category_product_counts"),
  ]);

  if (error) throw new Error(error.message);
  if (countError) throw new Error(countError.message);

  const byCategory = new Map<string, number>();
  for (const row of counts ?? []) {
    byCategory.set(row.category_id, Number(row.product_count ?? 0));
  }

  return (rows ?? []).map((row) => ({
    ...(row as Omit<CategoryWithCount, "product_count">),
    product_count: byCategory.get((row as { id: string }).id) ?? 0,
  }));
}

export const categoriesQuery = () =>
  queryOptions({ queryKey: ["categories"] as const, queryFn: fetchCategories });

export function useCategories() {
  return useQuery(categoriesQuery());
}

export const productsQuery = () =>
  queryOptions({ queryKey: ["products"] as const, queryFn: fetchProducts });

export const productQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug] as const,
    queryFn: () => fetchProduct(slug),
    enabled: Boolean(slug),
  });

export const reviewsQuery = (productId?: string) =>
  queryOptions({
    queryKey: ["reviews", productId ?? "all"] as const,
    queryFn: () => fetchReviews(productId),
  });

export function useProducts() {
  return useQuery(productsQuery());
}

export function useProduct(slug: string) {
  return useQuery(productQuery(slug));
}

export function useReviews(productId?: string) {
  return useQuery(reviewsQuery(productId));
}

/** Sorted active variants, cheapest first — the order the UI wants. */
export function sortVariants(variants: CatalogueVariant[]): CatalogueVariant[] {
  return [...variants]
    .filter((v) => v.is_active)
    .sort((a, b) => a.sort_order - b.sort_order || a.price - b.price);
}

function primaryImage(variant: CatalogueVariant | undefined): string | null {
  if (!variant) return null;
  const sorted = [...variant.variant_images].sort((a, b) => a.sort_order - b.sort_order);
  return sorted[0]?.url ?? null;
}

export function productImage(product: CatalogueProduct): string | null {
  for (const variant of sortVariants(product.product_variants)) {
    const image = primaryImage(variant);
    if (image) return image;
  }
  return null;
}

export function allImages(product: CatalogueProduct): string[] {
  const urls: string[] = [];
  for (const variant of sortVariants(product.product_variants)) {
    for (const image of [...variant.variant_images].sort((a, b) => a.sort_order - b.sort_order)) {
      if (!urls.includes(image.url)) urls.push(image.url);
    }
  }
  return urls;
}

export function priceRange(product: CatalogueProduct): { min: number; max: number } | null {
  const variants = sortVariants(product.product_variants);
  if (variants.length === 0) return null;
  const prices = variants.map((v) => v.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function totalStock(product: CatalogueProduct): number {
  return sortVariants(product.product_variants).reduce((sum, v) => sum + v.stock, 0);
}

export function averageRating(reviews: PublicReview[]): number | null {
  if (reviews.length === 0) return null;
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}
