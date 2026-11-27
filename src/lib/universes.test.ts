import { describe, expect, it } from "vitest";
import type { CatalogueProduct } from "./queries";
import { UNIVERSE_SECTIONS } from "./universe-sections";
import { hasAlias, normalize } from "./universe-taxonomy";
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

const counts = (slug: string, universe: "anime" | "streetwear" | "algeria" | "football") =>
  Object.fromEntries(
    buildUniverse([product({ slug, name: slug, name_fr: slug })], universe).sections.flatMap(
      (section) => section.entries.map((row) => [row.entry.id, row.count]),
    ),
  );

describe("declared structure", () => {
  it("keeps every shelf when the catalogue is empty", () => {
    for (const universe of ["anime", "streetwear", "algeria", "football"] as const) {
      const catalog = buildUniverse([], universe);
      expect(catalog.members).toHaveLength(0);
      expect(catalog.sections).toHaveLength(UNIVERSE_SECTIONS[universe].length);
      for (const section of catalog.sections) {
        expect(section.entries.length).toBeGreaterThan(0);
        for (const row of section.entries) expect(row.count).toBe(0);
      }
    }
  });

  it("declares the nine Anime collections in the storefront's order, plus Other anime", () => {
    const anime = buildUniverse([], "anime").sections[0];
    expect(anime.entries.map((row) => row.entry.id)).toEqual([
      "series:attack-on-titan",
      "series:blue-lock",
      "series:dandadan",
      "series:demon-slayer",
      "series:dragon-ball",
      "series:hunter-x-hunter",
      "series:jujutsu-kaisen",
      "series:naruto",
      "series:one-piece",
      "series:other",
    ]);
  });

  it("declares the Algeria Design themes", () => {
    const algeria = buildUniverse([], "algeria").sections[0];
    expect(algeria.entries.map((row) => row.entry.id)).toEqual([
      "theme:flag",
      "theme:amazigh",
      "theme:casbah",
      "theme:sahara",
      "theme:constantine",
      "theme:oran",
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

  it("files a promoted collection on its own shelf", () => {
    const result = counts("hoodie blue lock", "anime");
    expect(result["series:blue-lock"]).toBe(1);
    expect(result["series:other"]).toBe(0);
  });

  it("aggregates a series outside the nine under Other anime", () => {
    const result = counts("hoodie bleach", "anime");
    expect(result["series:other"]).toBe(1);
  });

  it("files an Algeria Design theme on its own shelf", () => {
    const result = counts("hoodie casbah", "algeria");
    expect(result["theme:casbah"]).toBe(1);
    expect(result["theme:sahara"]).toBe(0);
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

describe("one universe per product", () => {
  it("keeps an anime piece out of Streetwear", () => {
    const tee = product({ slug: "tee", name: "تي شيرت ناروتو" });
    expect(productFacets(tee).universes).toEqual(["anime"]);
    expect(buildUniverse([tee], "streetwear").members).toHaveLength(0);
  });

  it("keeps an Algeria Design piece out of Streetwear", () => {
    const hoodie = product({ slug: "hoodie", name: "hoodie casbah" });
    expect(productFacets(hoodie).universes).toEqual(["algeria"]);
    expect(buildUniverse([hoodie], "streetwear").members).toHaveLength(0);
  });

  it("gives Football priority over Algeria when a club is named", () => {
    const scarf = product({ slug: "jsk", name: "hoodie jsk casbah" });
    expect(productFacets(scarf).universes).toEqual(["football"]);
  });

  it("files a piece by its admin category when the name says nothing", () => {
    const naruto = product({
      slug: "piece",
      name: "قطعة",
      categories: { slug: "anime-naruto", name: "ناروتو", name_fr: "Naruto" },
    });
    const facets = productFacets(naruto);
    expect(facets.universes).toEqual(["anime"]);
    expect(facets.series).toEqual(["naruto"]);

    const algeria = product({
      slug: "piece-2",
      name: "قطعة",
      categories: { slug: "algeria-design", name: "تصميم جزائري", name_fr: "Algeria Design" },
    });
    expect(productFacets(algeria).universes).toEqual(["algeria"]);
  });
});

describe("alias matching", () => {
  it("matches a multi-word Latin alias only on word boundaries", () => {
    expect(hasAlias(normalize("oversize t-shirt"), "t-shirt")).toBe(true);
    // "t shirt" sits inside "sweat shirt": a substring match would file a
    // sweatshirt on the tee shelf.
    expect(hasAlias(normalize("oversize sweat shirt"), "t-shirt")).toBe(false);
  });

  it("keeps Arabic phrases matched as written", () => {
    expect(hasAlias(normalize("هودي القصبة"), "القصبة")).toBe(true);
  });
});

describe("a city name is a theme, not a club", () => {
  it("files a bare Oran piece under the Oran theme", () => {
    const hoodie = product({ slug: "oran", name: "هودي وهران" });
    expect(productFacets(hoodie).universes).toEqual(["algeria"]);
    expect(productFacets(hoodie).themes).toEqual(["oran"]);
    expect(productFacets(hoodie).clubs).toEqual([]);
  });

  it("files a bare Constantine piece under the Constantine theme", () => {
    const hoodie = product({ slug: "constantine", name: "هودي قسنطينة" });
    expect(productFacets(hoodie).universes).toEqual(["algeria"]);
    expect(productFacets(hoodie).themes).toEqual(["constantine"]);
    expect(productFacets(hoodie).clubs).toEqual([]);
  });

  it("still files the full club name under Football", () => {
    const hoodie = product({ slug: "mco", name: "هودي مولودية وهران" });
    expect(productFacets(hoodie).universes).toEqual(["football"]);
    expect(productFacets(hoodie).clubs).toEqual(["mco"]);
  });

  it("recognises the French club name", () => {
    const hoodie = product({ slug: "barca", name: "Hoodie Barcelone" });
    expect(productFacets(hoodie).universes).toEqual(["football"]);
    expect(productFacets(hoodie).clubs).toEqual(["barcelona"]);
  });
});
