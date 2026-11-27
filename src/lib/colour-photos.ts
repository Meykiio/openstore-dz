import { deleteProductImage, storageKey } from "./image";
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

/**
 * Delete the stored file only when no variant still shows it.
 *
 * Two rows can name one object with different percent-escapes (`a.webp` and
 * `a%2Ewebp` decode to the same key), so the reference check compares decoded
 * keys rather than raw spellings: otherwise deleting one row would break a
 * photo the other row still displays. The lookup is scoped to the object's own
 * folder, so it never reads the whole table.
 */
export async function removeIfUnused(url: string): Promise<void> {
  const key = storageKey(url);
  // A pasted address from another host names no object of ours.
  if (!key) return;
  const folder = key.slice(0, key.lastIndexOf("/") + 1);
  const { data, error } = await getSupabase()
    .from("variant_images")
    .select("url")
    .like("url", `%${folder}%`);
  if (error) return;
  const stillShown = ((data ?? []) as { url: string }[]).some((row) => storageKey(row.url) === key);
  if (stillShown) return;
  await deleteProductImage(url);
}
