import { describe, expect, it } from "vitest";
import type { CatalogueVariant } from "./queries";
import {
  colourOptions,
  findVariant,
  imagesForColour,
  initialChoice,
  sizeAfterColourChange,
  sizeOptions,
} from "./variant-options";

let seq = 0;
function v(color: string | null, size: string | null, stock: number, urls: string[] = []) {
  seq += 1;
  return {
    id: `v${seq}`,
    size,
    color_name: color,
    color_hex: color ? "#000000" : null,
    sku: null,
    price: 2500,
    stock,
    is_active: true,
    sort_order: seq,
    variant_images: urls.map((url, i) => ({ id: `${url}-${seq}`, url, alt: null, sort_order: i })),
  } satisfies CatalogueVariant;
}

const polo = [
  v("Noir", "XL", 2, ["noir-1", "noir-2"]),
  v("Noir", "S", 0, ["noir-1", "noir-2"]),
  v("Noir", "M", 5, ["noir-1", "noir-2"]),
  v("Blanc", "M", 0, ["blanc-1"]),
  v("Blanc", "L", 3, ["blanc-1"]),
];

describe("variant options", () => {
  it("lists each colour once, in stock if any size is", () => {
    expect(colourOptions(polo).map((c) => [c.name, c.inStock])).toEqual([
      ["Noir", true],
      ["Blanc", true],
    ]);
  });

  it("orders sizes the way people read them, per colour", () => {
    expect(sizeOptions(polo, "Noir").map((s) => s.name)).toEqual(["S", "M", "XL"]);
    expect(sizeOptions(polo, "Noir").find((s) => s.name === "S")?.inStock).toBe(false);
  });

  it("opens on something buyable", () => {
    expect(initialChoice(polo)).toEqual({ colour: "Noir", size: "XL" });
  });

  it("keeps the size across a colour change only when it is in stock there", () => {
    expect(sizeAfterColourChange(polo, "Blanc", "L")).toBe("L");
    expect(sizeAfterColourChange(polo, "Blanc", "M")).toBe("L");
    expect(sizeAfterColourChange(polo, "Noir", "L")).toBe("M");
  });

  it("finds the exact variant", () => {
    expect(findVariant(polo, "Blanc", "L")?.stock).toBe(3);
    expect(findVariant(polo, "Blanc", "XL")).toBeNull();
  });

  it("shows one colour's photos, without duplicates", () => {
    expect(imagesForColour(polo, "Noir")).toEqual(["noir-1", "noir-2"]);
    expect(imagesForColour(polo, null)).toEqual(["noir-1", "noir-2", "blanc-1"]);
  });

  it("handles products with sizes only", () => {
    const sizesOnly = [v(null, "L", 1), v(null, "M", 1)];
    expect(colourOptions(sizesOnly)).toEqual([]);
    expect(sizeOptions(sizesOnly, null).map((s) => s.name)).toEqual(["M", "L"]);
  });
});
