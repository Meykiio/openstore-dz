import { beforeEach, describe, expect, it, vi } from "vitest";

/*
 * Deleting a product or a size removes its stored photos. The property under
 * test is the safety one: cleanup may only reach files inside the item's own
 * folder, and only when no row still shows them. Supabase and the storage
 * helper are replaced with recorders, so nothing here can touch a bucket.
 */
const state = vi.hoisted(() => ({
  /** Rows returned for each table, keyed by the filter value. */
  variants: {} as Record<string, { data: unknown; error: { message: string } | null }>,
  /** How many variant_images rows still point at a URL. */
  references: {} as Record<string, number>,
  deleted: [] as string[],
}));

vi.mock("./supabase/client", () => ({
  getSupabase: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: (_column: string, value: string) => {
          if (table === "variant_images") {
            return Promise.resolve({ count: state.references[value] ?? 0, error: null });
          }
          const row = state.variants[value] ?? { data: null, error: null };
          return Object.assign(Promise.resolve(row), {
            maybeSingle: async () => row,
          });
        },
      }),
    }),
  }),
}));

vi.mock("./image", () => ({
  deleteProductImage: async (url: string) => {
    state.deleted.push(url);
  },
}));

import { ownsUrl, productPhotoUrls, removeOwnedFiles, variantPhotoUrls } from "./product-media";

const PRODUCT = "product-1";
const owned = (name: string, productId = PRODUCT) =>
  `https://example.supabase.co/storage/v1/object/public/product-media/products/${productId}/${name}`;

beforeEach(() => {
  state.variants = {};
  state.references = {};
  state.deleted = [];
});

describe("ownsUrl", () => {
  it("claims a file in the product's own folder", () => {
    expect(ownsUrl(owned("a.webp"), PRODUCT)).toBe(true);
  });

  it("refuses another product's folder", () => {
    expect(ownsUrl(owned("a.webp", "product-2"), PRODUCT)).toBe(false);
  });

  it("refuses an external address", () => {
    expect(ownsUrl("https://cdn.example.com/photo.jpg", PRODUCT)).toBe(false);
  });

  it("refuses a lookalike folder name", () => {
    expect(ownsUrl(owned("a.webp", "product-10"), PRODUCT)).toBe(false);
  });
});

describe("removeOwnedFiles", () => {
  it("deletes an owned file nothing shows any more", async () => {
    await removeOwnedFiles([owned("a.webp")], PRODUCT);
    expect(state.deleted).toEqual([owned("a.webp")]);
  });

  it("keeps an owned file another size still shows", async () => {
    state.references[owned("a.webp")] = 2;
    await removeOwnedFiles([owned("a.webp")], PRODUCT);
    expect(state.deleted).toEqual([]);
  });

  it("never touches a file outside the product's folder", async () => {
    await removeOwnedFiles(
      [owned("a.webp", "product-2"), "https://cdn.example.com/x.jpg"],
      PRODUCT,
    );
    expect(state.deleted).toEqual([]);
  });
});

describe("productPhotoUrls", () => {
  it("collects every variant's photos once", async () => {
    state.variants[PRODUCT] = {
      data: [
        { variant_images: [{ url: owned("a.webp") }, { url: owned("b.webp") }] },
        { variant_images: [{ url: owned("a.webp") }] },
      ],
      error: null,
    };
    expect(await productPhotoUrls(PRODUCT)).toEqual([owned("a.webp"), owned("b.webp")]);
  });

  it("reports a failed read instead of returning an empty list", async () => {
    state.variants[PRODUCT] = { data: null, error: { message: "permission denied" } };
    await expect(productPhotoUrls(PRODUCT)).rejects.toThrow("permission denied");
  });
});

describe("variantPhotoUrls", () => {
  it("returns the photos with the product that owns the folder", async () => {
    state.variants["variant-1"] = {
      data: {
        product_id: PRODUCT,
        variant_images: [{ url: owned("a.webp") }, { url: owned("a.webp") }],
      },
      error: null,
    };
    expect(await variantPhotoUrls("variant-1")).toEqual({
      productId: PRODUCT,
      urls: [owned("a.webp")],
    });
  });

  it("returns nothing for a size that is already gone", async () => {
    expect(await variantPhotoUrls("variant-missing")).toBeNull();
  });
});
