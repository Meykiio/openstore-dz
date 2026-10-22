import type { CatalogueVariant } from "./queries";

/**
 * Splitting a product's variants into the two choices a buyer actually makes.
 *
 * Variants are stored as colour × size rows. Showing them as one list of
 * "M / Noir" chips is fine at four variants and unusable at a hundred, which a
 * real clothing catalogue reaches quickly. A buyer picks a colour, then a size,
 * and the gallery follows the colour.
 */

export type ColourOption = { name: string; hex: string | null; inStock: boolean };
export type SizeOption = { name: string; inStock: boolean };

// Clothing sizes in the order people read them. Anything unknown (shoe sizes,
// "42", "Taille unique") keeps the order the owner gave it, after these.
const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL", "XXXL", "4XL", "5XL"];

function sizeRank(size: string): number {
  const index = SIZE_ORDER.indexOf(size.trim().toUpperCase());
  return index === -1 ? SIZE_ORDER.length : index;
}

export function colourOptions(variants: CatalogueVariant[]): ColourOption[] {
  const byName = new Map<string, ColourOption>();
  for (const variant of variants) {
    if (!variant.color_name) continue;
    const existing = byName.get(variant.color_name);
    if (existing) {
      existing.inStock ||= variant.stock > 0;
    } else {
      byName.set(variant.color_name, {
        name: variant.color_name,
        hex: variant.color_hex,
        inStock: variant.stock > 0,
      });
    }
  }
  return [...byName.values()];
}

/** Sizes offered in a colour, or across the product when it has no colours. */
export function sizeOptions(variants: CatalogueVariant[], colour: string | null): SizeOption[] {
  const bySize = new Map<string, SizeOption>();
  variants.forEach((variant) => {
    if (!variant.size) return;
    if (colour !== null && variant.color_name !== colour) return;
    const existing = bySize.get(variant.size);
    if (existing) existing.inStock ||= variant.stock > 0;
    else bySize.set(variant.size, { name: variant.size, inStock: variant.stock > 0 });
  });
  // Array.prototype.sort is stable, so unknown sizes keep their stored order.
  return [...bySize.values()].sort((a, b) => sizeRank(a.name) - sizeRank(b.name));
}

export function findVariant(
  variants: CatalogueVariant[],
  colour: string | null,
  size: string | null,
): CatalogueVariant | null {
  return (
    variants.find(
      (v) => (colour === null || v.color_name === colour) && (size === null || v.size === size),
    ) ?? null
  );
}

/** The first in-stock variant, so the page opens on something buyable. */
export function initialChoice(variants: CatalogueVariant[]): {
  colour: string | null;
  size: string | null;
} {
  const first = variants.find((v) => v.stock > 0) ?? variants[0];
  return { colour: first?.color_name ?? null, size: first?.size ?? null };
}

/**
 * Keep the buyer's size when they switch colour, if that colour has it in
 * stock. Otherwise move to the first size that is.
 */
export function sizeAfterColourChange(
  variants: CatalogueVariant[],
  colour: string | null,
  size: string | null,
): string | null {
  const sizes = sizeOptions(variants, colour);
  if (sizes.length === 0) return null;
  if (size && sizes.some((s) => s.name === size && s.inStock)) return size;
  return (sizes.find((s) => s.inStock) ?? sizes[0]).name;
}

/** Images for one colour, de-duplicated. Every size of a colour shares photos. */
export function imagesForColour(variants: CatalogueVariant[], colour: string | null): string[] {
  const urls: string[] = [];
  for (const variant of variants) {
    if (colour !== null && variant.color_name !== colour) continue;
    const sorted = [...variant.variant_images].sort((a, b) => a.sort_order - b.sort_order);
    for (const image of sorted) if (!urls.includes(image.url)) urls.push(image.url);
  }
  return urls;
}
