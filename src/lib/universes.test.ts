import { describe, expect, it } from "vitest";
import type { CatalogueProduct } from "./queries";
import { UNIVERSE_SECTIONS } from "./universe-sections";
import { buildUniverse, matchesEntry, productFacets } from "./universes";

function product(overrides: Partial<CatalogueProduct> = {}): CatalogueProduct {
  return {
    id: overrides.slug ?? "id",
    slug: "piece",
    name: "قطعة",
    name_fr: null,
    description: null,
    description_fr: null,
    kind: "single",
    status: "draft",
    category_id: null,
    categories: null,
    published_at: null,
    product_variants: [],
    ...overrides,
  } as CatalogueProduct;
}

const counts = (slug: string, universe: "anime" | "streetwear" | "football") =>
  Object.fromEntries(
    buildUniverse([product({ slug, name: slug, name_fr: slug })], universe).sections.flatMap(
      (section) => section.entries.map((row) => [row.entry.id, row.count]),
    ),
  );

describe("declared structure", () => {
  it("keeps every shelf when the catalogue is empty", () => {
    for (const universe of ["anime", "streetwear", "football"] as const) {
      const catalog = buildUniverse([], universe);
      expect(catalog.members).toHaveLength(0);
      expect(catalog.sections).toHaveLength(UNIVERSE_SECTIONS[universe].length);
      for (const section of catalog.sections) {
        expect(section.entries.length).toBeGreaterThan(0);
        for (const row of section.entries) expect(row.count).toBe(0);
      }
    }
  });

  it("declares the anime series the brief promotes, plus Other anime", () => {
    const anime = buildUniverse([], "anime").sections[0];
    expect(anime.entries.map((row) => row.entry.id)).toEqual([
      "series:naruto",
      "series:one-piece",
      "series:jujutsu-kaisen",
      "series:dragon-ball",
      "series:bleach",
      "series:other",
    ]);
  });

  it("declares both club regions and the four football piece types", () => {
    const football = buildUniverse([], "football").sections;
    expect(football.find((section) => section.id === "clubs-europe")?.entries).toHaveLength(6);
    expect(football.find((section) => section.id === "clubs-algeria")?.entries).toHaveLength(6);
    expect(
      football.find((section) => section.id === "types")?.entries.map((r) => r.entry.id),
    ).toEqual(["type:tee", "type:hoodie", "type:tracksuit", "type:sweatshirt"]);
  });
});

describe("shelf matching", () => {
  it("files a promoted series and leaves Other anime at zero", () => {
    const result = counts("تي شيرت ناروتو أوفرسايز", "anime");
    expect(result["series:naruto"]).toBe(1);
    expect(result["series:other"]).toBe(0);
  });

  it("aggregates a series the brief does not promote under Other anime", () => {
    const result = counts("hoodie blue lock", "anime");
    expect(result["series:blue-lock"]).toBeUndefined();
    expect(result["series:other"]).toBe(1);
  });

  it("files a club by region and keeps Other clubs separate", () => {
    const result = counts("hoodie barcelona", "football");
    expect(result["club:barcelona"]).toBe(1);
    expect(result["club:other-europe"]).toBe(0);
    expect(result["club:jsk"]).toBe(0);
    expect(result["type:hoodie"]).toBe(1);
  });

  it("shows a promoted Algerian club on its own shelf", () => {
    expect(counts("ensemble jsk", "football")["club:jsk"]).toBe(1);
  });

  it("only calls a tee oversize when the piece says so", () => {
    expect(counts("تي شيرت أوفرسايز", "streetwear")["type:tee"]).toBe(1);
    expect(counts("تي شيرت قطن", "streetwear")["type:tee"]).toBe(0);
  });

  it("puts a polo on the category shelf even with no vibe text", () => {
    const polo = product({
      slug: "polo",
      name: "بولو",
      categories: { slug: "polos", name: "بولو", name_fr: "Polos" },
    });
    const catalog = buildUniverse([polo], "streetwear");
    const entry = catalog.sections[0].entries.find((row) => row.entry.id === "category:polos");
    expect(entry?.count).toBe(1);
    expect(matchesEntry(polo, productFacets(polo), entry!.entry)).toBe(true);
  });
});
