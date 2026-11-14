import { attachToVariants } from "./colour-photos";
import { PRODUCT_ASPECT, uploadProductImage } from "./image";
import { getSupabase } from "./supabase/client";

/**
 * The one-time photo link Claude hands the owner (/admin/upload/<code>).
 *
 * Photos go through exactly the admin's own path: cropped to 4:5 and resized in
 * the browser (`uploadProductImage`), then linked to every size of the colour
 * (`attachToVariants`). The link is closed once the photos are in.
 */

export type UploadLink = {
  product_id: string;
  product_name: string;
  color_name: string | null;
  drive_url: string | null;
  used: boolean;
  expired: boolean;
};

export async function getUploadLink(code: string): Promise<UploadLink | null> {
  const { data, error } = await getSupabase().rpc("ai_upload_get", { p_code: code });
  if (error) throw new Error(error.message);
  return (data as UploadLink | null) ?? null;
}

/** The colour's variants and the position after its last photo. */
async function colourTargets(link: UploadLink): Promise<{ ids: string[]; next: number }> {
  let query = getSupabase()
    .from("product_variants")
    .select("id, variant_images ( sort_order )")
    .eq("product_id", link.product_id);
  query = link.color_name ? query.eq("color_name", link.color_name) : query.is("color_name", null);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const orders = data.flatMap((v) => v.variant_images.map((i) => i.sort_order));
  return { ids: data.map((v) => v.id), next: orders.length ? Math.max(...orders) + 1 : 0 };
}

/** Upload, attach, then close the link. Returns how many photos were added. */
export async function addPhotos(
  code: string,
  link: UploadLink,
  files: File[],
  focus: number,
  onProgress: (done: number) => void,
): Promise<number> {
  const { ids, next } = await colourTargets(link);
  if (ids.length === 0) throw new Error("This colour has no variants any more.");
  let added = 0;
  for (const file of files) {
    const outcome = await uploadProductImage(file, link.product_id, {
      aspect: PRODUCT_ASPECT,
      focus,
    });
    if (outcome.error || !outcome.url) throw new Error(outcome.error ?? "Upload failed.");
    await attachToVariants(ids, outcome.url, next + added);
    added += 1;
    onProgress(added);
  }
  await getSupabase().rpc("ai_upload_finish", { p_code: code });
  return added;
}

/** Ask the server for the link's Google Drive file, as a File the page can crop. */
export async function fetchDriveFile(code: string): Promise<File> {
  const { data } = await getSupabase().auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Sign in again.");
  const response = await fetch("/api/ai-drive", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({ code }),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Drive import failed (${response.status}).`);
  }
  const blob = await response.blob();
  return new File([blob], "drive-photo", { type: blob.type });
}
