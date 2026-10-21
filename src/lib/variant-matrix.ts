import { slugify } from "./format";

/**
 * Colour × size → variant rows, for the generator on the product screen.
 *
 * An owner thinks "this polo comes in 12 colours and 5 sizes", not "60
 * variants". This turns the first into the second, and leaves alone any
 * combination that already exists, so running it twice cannot duplicate stock.
 */

export type MatrixColour = { name: string; hex: string };

export type MatrixRow = {
  color_name: string | null;
  color_hex: string | null;
  size: string | null;
  sku: string;
  price: number;
  stock: number;
  sort_order: number;
  is_active: boolean;
};

type Existing = { color_name: string | null; size: string | null };

// Names owners actually type, in the three languages the shop speaks. A guess
// only: the owner can always correct the swatch before generating.
const KNOWN: Record<string, string> = {
  noir: "#111114",
  black: "#111114",
  أسود: "#111114",
  اسود: "#111114",
  blanc: "#f4f2ee",
  white: "#f4f2ee",
  أبيض: "#f4f2ee",
  ابيض: "#f4f2ee",
  gris: "#8b8b90",
  grey: "#8b8b90",
  gray: "#8b8b90",
  رمادي: "#8b8b90",
  beige: "#d8c7a8",
  بيج: "#d8c7a8",
  bleu: "#2f5fb3",
  blue: "#2f5fb3",
  أزرق: "#2f5fb3",
  ازرق: "#2f5fb3",
  "bleu marine": "#1c2a4a",
  marine: "#1c2a4a",
  navy: "#1c2a4a",
  كحلي: "#1c2a4a",
  rouge: "#b3261e",
  red: "#b3261e",
  أحمر: "#b3261e",
  احمر: "#b3261e",
  vert: "#2f6b46",
  green: "#2f6b46",
  أخضر: "#2f6b46",
  اخضر: "#2f6b46",
  jaune: "#e3b505",
  yellow: "#e3b505",
  أصفر: "#e3b505",
  اصفر: "#e3b505",
  rose: "#e8a0b4",
  pink: "#e8a0b4",
  وردي: "#e8a0b4",
  violet: "#6b4c9a",
  purple: "#6b4c9a",
  بنفسجي: "#6b4c9a",
  marron: "#6b4226",
  brown: "#6b4226",
  بني: "#6b4226",
  orange: "#e07020",
  برتقالي: "#e07020",
  kaki: "#8a8a5c",
  khaki: "#8a8a5c",
  bordeaux: "#5c1a2b",
  burgundy: "#5c1a2b",
};

export function guessHex(name: string): string | null {
  return KNOWN[name.trim().toLowerCase()] ?? null;
}

const same = (a: string | null, b: string | null) =>
  (a ?? "").trim().toLowerCase() === (b ?? "").trim().toLowerCase();

export function buildMatrix(input: {
  productSlug: string;
  colours: MatrixColour[];
  sizes: string[];
  price: number;
  stock: number;
  existing: Existing[];
}): { rows: MatrixRow[]; skipped: number } {
  const colours: (MatrixColour | null)[] = input.colours.length > 0 ? input.colours : [null];
  const sizes: (string | null)[] = input.sizes.length > 0 ? input.sizes : [null];
  if (input.colours.length === 0 && input.sizes.length === 0) return { rows: [], skipped: 0 };

  const rows: MatrixRow[] = [];
  let skipped = 0;
  for (const colour of colours) {
    for (const size of sizes) {
      const name = colour?.name ?? null;
      if (input.existing.some((v) => same(v.color_name, name) && same(v.size, size))) {
        skipped += 1;
        continue;
      }
      rows.push({
        color_name: name,
        color_hex: colour?.hex ?? null,
        size,
        sku: [input.productSlug, name, size]
          .filter(Boolean)
          .map((part) => slugify(part as string) || "x")
          .join("-")
          .toUpperCase()
          .slice(0, 64),
        price: input.price,
        stock: input.stock,
        sort_order: input.existing.length + rows.length,
        is_active: true,
      });
    }
  }
  return { rows, skipped };
}
