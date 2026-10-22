/**
 * Sale pricing, display only.
 *
 * `price` is what the buyer pays and what the database charges. The original
 * price only explains a discount: it never reaches the order, so a wrong value
 * here can mislead a buyer but cannot change a total.
 */
export type Sale = { was: number; percent: number };

export function saleOf(variant: { price: number; compare_at_price?: number | null }): Sale | null {
  const was = variant.compare_at_price ?? 0;
  // An "original" at or below the selling price is not a discount, and showing
  // it struck through would claim one that does not exist.
  if (was <= variant.price || variant.price <= 0) return null;
  return { was, percent: Math.round(((was - variant.price) / was) * 100) };
}
