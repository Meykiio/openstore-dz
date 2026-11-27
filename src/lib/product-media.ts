import { removeIfUnused } from "./colour-photos";
import { getSupabase } from "./supabase/client";

/**
 * The image files a product owns.
 *
 * Uploads are stored at `product-media/products/<productId>/<uuid>.<ext>`, so
 * the folder says which product may delete a file. A pasted external address,
 * or a photo borrowed from another product, is never inside this product's
 * folder and is therefore never touched: cleanup cannot reach outside the item
 * being deleted, and nothing here lists or empties the bucket.
 */

/** Whether a stored file lives in this product's own folder. */
export function ownsUrl(url: string, productId: string): boolean {
  return url.includes(`/product-media/products/${productId}/`);
}

/** Delete the files this product owns that no variant shows any more. */
export async function removeOwnedFiles(urls: readonly string[], productId: string): Promise<void> {
  for (const url of urls) {
    if (ownsUrl(url, productId)) await removeIfUnused(url);
  }
}

/** Unique photo URLs across every variant of a product. */
export async function productPhotoUrls(productId: string): Promise<string[]> {
  const { data, error } = await getSupabase()
    .from("product_variants")
    .select("variant_images ( url )")
    .eq("product_id", productId);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as unknown as { variant_images: { url: string }[] }[];
  return [...new Set(rows.flatMap((row) => row.variant_images.map((image) => image.url)))];
}

/** One variant's photo URLs, with the product they belong to. */
export async function variantPhotoUrls(
  variantId: string,
): Promise<{ productId: string; urls: string[] } | null> {
  const { data, error } = await getSupabase()
    .from("product_variants")
    .select("product_id, variant_images ( url )")
    .eq("id", variantId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const row = data as unknown as { product_id: string; variant_images: { url: string }[] };
  return {
    productId: row.product_id,
    urls: [...new Set(row.variant_images.map((image) => image.url))],
  };
}
