import { queryOptions, useQuery } from "@tanstack/react-query";
import { getSupabase } from "./supabase/client";

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

export type StoreSettings = {
  id: number;
  name: string;
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  legal_name: string | null;
  nif: string | null;
  rc_number: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  free_shipping_threshold: number;
  currency: string;
  delivery_fee_flat: number;
  delivery_wilayas: string[];
  delivery_eta_days: number;
  returns_days: number;
  accepts_cod: boolean;
  guepex_from_wilaya: string | null;
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

async function fetchSettings(): Promise<StoreSettings | null> {
  const { data, error } = await getSupabase()
    .from("store_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as StoreSettings | null) ?? null;
}

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

export const storeSettingsQuery = () =>
  queryOptions({ queryKey: ["store_settings"] as const, queryFn: fetchSettings });

/**
 * Active categories, each with how many published products it holds.
 *
 * The count comes from a separate read and is joined here rather than using a
 * PostgREST aggregate, because counting only published products needs the same
 * `status` filter the storefront uses, and keeping that rule in one place in
 * TypeScript is less error prone than duplicating it in a query string.
 */
async function fetchCategories(): Promise<CategoryWithCount[]> {
  const supabase = getSupabase();

  const [{ data: rows, error }, { data: products, error: productError }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, slug, name, name_fr, description, image_url, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase.from("products").select("category_id").eq("status", "published"),
  ]);

  if (error) throw new Error(error.message);
  if (productError) throw new Error(productError.message);

  const counts = new Map<string, number>();
  for (const row of products ?? []) {
    const id = (row as { category_id: string | null }).category_id;
    if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return (rows ?? []).map((row) => ({
    ...(row as Omit<CategoryWithCount, "product_count">),
    product_count: counts.get((row as { id: string }).id) ?? 0,
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

export function useStoreSettings() {
  return useQuery(storeSettingsQuery());
}

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
