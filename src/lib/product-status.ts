/**
 * The one place a product's status changes.
 *
 * The status control on the editor, the toggle on the product list and the
 * publish button all end up here, so the rule below cannot be skipped by a
 * control that forgets it.
 */

import { getSupabase } from "./supabase/client";

/** The three states the products table allows, enforced by a check constraint. */
export type ProductStatus = "draft" | "published" | "archived";

/** The only variant detail the publish rule needs. */
type VariantState = { is_active: boolean };

/**
 * Whether a product may be shown to buyers.
 *
 * The storefront drops inactive variants before rendering, so a product whose
 * variants are all switched off shows a page with no price and no way to buy.
 * Publishing that is never what the owner meant.
 */
export function canPublish(variants: readonly VariantState[]): boolean {
  return variants.some((variant) => variant.is_active);
}

/** Raised instead of writing `published` when the product has nothing to sell. */
export class ProductCannotPublishError extends Error {
  constructor() {
    super("product has no active variants");
    this.name = "ProductCannotPublishError";
  }
}

/**
 * The text to show when a status change fails.
 *
 * The translation is passed in rather than looked up here, so this module stays
 * free of the i18n layer while both panels still word the refusal identically.
 */
export function statusErrorMessage(error: Error, noActiveVariants: string): string {
  return error instanceof ProductCannotPublishError ? noActiveVariants : error.message;
}

/**
 * Change a product's status. The write is guarded here rather than in the
 * callers, and the current row is read here rather than taken from them: a
 * stale row in the list would otherwise re-date an old product.
 *
 * `published_at` is stamped on first publish only. Unpublishing keeps the
 * stamp, so republishing restores the original date instead of jumping the
 * product back to the top of the shop.
 */
export async function setProductStatus(id: string, status: ProductStatus): Promise<void> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("products")
    .select("published_at, product_variants ( is_active )")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("This product no longer exists.");

  const row = data as unknown as {
    published_at: string | null;
    product_variants: VariantState[];
  };

  if (status === "published" && !canPublish(row.product_variants)) {
    throw new ProductCannotPublishError();
  }

  const patch: { status: ProductStatus; published_at?: string } = { status };
  if (status === "published" && !row.published_at) {
    patch.published_at = new Date().toISOString();
  }

  const { error: updateError } = await supabase.from("products").update(patch).eq("id", id);
  if (updateError) throw new Error(updateError.message);
}
