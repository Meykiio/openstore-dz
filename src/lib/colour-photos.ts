import { deleteProductImage } from "./image";
import { getSupabase } from "./supabase/client";

/**
 * Photos shared across a colour's sizes.
 *
 * Every size of a colour shows the same photos, so a photo is uploaded once
 * and referenced by each of those variants. That sharing is why a stored file
 * may only be deleted once nothing points at it any more: deleting it with the
 * first row would blank the photo on every other size.
 */

export async function attachToVariants(
  variantIds: string[],
  url: string,
  sortOrder: number,
): Promise<void> {
  if (variantIds.length === 0) return;
  const { error } = await getSupabase()
    .from("variant_images")
    .insert(variantIds.map((variant_id) => ({ variant_id, url, sort_order: sortOrder })));
  if (error) throw new Error(error.message);
}

export async function detachFromVariants(variantIds: string[], url: string): Promise<void> {
  const { error } = await getSupabase()
    .from("variant_images")
    .delete()
    .in("variant_id", variantIds)
    .eq("url", url);
  if (error) throw new Error(error.message);
  await removeIfUnused(url);
}

/** Delete the stored file only when no variant still shows it. */
export async function removeIfUnused(url: string): Promise<void> {
  const { count, error } = await getSupabase()
    .from("variant_images")
    .select("id", { count: "exact", head: true })
    .eq("url", url);
  if (error || (count ?? 0) > 0) return;
  await deleteProductImage(url);
}
