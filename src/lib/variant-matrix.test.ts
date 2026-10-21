import { describe, expect, it } from "vitest";
import { buildMatrix, guessHex } from "./variant-matrix";

const base = { productSlug: "polo", price: 3200, stock: 5, existing: [] };

describe("buildMatrix", () => {
  it("creates every colour × size combination", () => {
    const { rows } = buildMatrix({
      ...base,
      colours: [
        { name: "Noir", hex: "#111114" },
        { name: "Blanc", hex: "#f4f2ee" },
      ],
      sizes: ["M", "L", "XL"],
    });
    expect(rows).toHaveLength(6);
    expect(rows[0]).toMatchObject({ color_name: "Noir", size: "M", price: 3200, stock: 5 });
    expect(rows[0].sku).toBe("POLO-NOIR-M");
  });

  it("skips combinations that already exist, so running twice is safe", () => {
    const { rows, skipped } = buildMatrix({
      ...base,
      colours: [{ name: "Noir", hex: "#111114" }],
      sizes: ["M", "L"],
      existing: [{ color_name: "noir", size: "M" }],
    });
    expect(skipped).toBe(1);
    expect(rows.map((r) => r.size)).toEqual(["L"]);
    // Numbered after the variants already there.
    expect(rows[0].sort_order).toBe(1);
  });

  it("works with sizes only or colours only", () => {
    expect(buildMatrix({ ...base, colours: [], sizes: ["40", "41"] }).rows).toHaveLength(2);
    expect(
      buildMatrix({ ...base, colours: [{ name: "Noir", hex: "#000" }], sizes: [] }).rows[0].size,
    ).toBeNull();
  });

  it("creates nothing from nothing", () => {
    expect(buildMatrix({ ...base, colours: [], sizes: [] }).rows).toEqual([]);
  });
});

describe("guessHex", () => {
  it("recognises common names in all three languages", () => {
    expect(guessHex("Noir")).toBe("#111114");
    expect(guessHex("black")).toBe("#111114");
    expect(guessHex("أسود")).toBe("#111114");
    expect(guessHex("Fuchsia électrique")).toBeNull();
  });
});
