import { beforeEach, describe, expect, it, vi } from "vitest";

/*
 * The transition writes to Supabase, so the client is replaced with a recorder:
 * these tests care about what would be written, not about the network.
 */
const state = vi.hoisted(() => ({
  row: null as { published_at: string | null; product_variants: { is_active: boolean }[] } | null,
  updates: [] as { table: string; patch: Record<string, unknown> }[],
  error: null as { message: string } | null,
}));

vi.mock("./supabase/client", () => ({
  getSupabase: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: state.row, error: state.error }) }),
      }),
      update: (patch: Record<string, unknown>) => ({
        eq: async () => {
          state.updates.push({ table, patch });
          return { error: null };
        },
      }),
    }),
  }),
}));

import {
  canPublish,
  ProductCannotPublishError,
  setProductStatus,
  statusErrorMessage,
} from "./product-status";

const off = { is_active: false };
const on = { is_active: true };

describe("canPublish", () => {
  it("refuses a product with no variants at all", () => {
    expect(canPublish([])).toBe(false);
  });

  it("refuses a product whose variants are all switched off", () => {
    expect(canPublish([off, off])).toBe(false);
  });

  it("allows a product with one active variant", () => {
    expect(canPublish([off, on])).toBe(true);
  });
});

describe("statusErrorMessage", () => {
  it("explains a blocked publish in the caller's language", () => {
    expect(statusErrorMessage(new ProductCannotPublishError(), "need a size")).toBe("need a size");
  });

  it("passes every other failure through unchanged", () => {
    expect(statusErrorMessage(new Error("network down"), "need a size")).toBe("network down");
  });
});

const active = [{ is_active: true }];
const publishedAt = "2026-01-01T00:00:00.000Z";

beforeEach(() => {
  state.row = { published_at: null, product_variants: active };
  state.updates = [];
  state.error = null;
});

describe("setProductStatus", () => {
  it("refuses to publish with no active variants, and writes nothing", async () => {
    state.row = { published_at: null, product_variants: [{ is_active: false }] };
    await expect(setProductStatus("p1", "published")).rejects.toBeInstanceOf(
      ProductCannotPublishError,
    );
    expect(state.updates).toEqual([]);
  });

  it("stamps published_at on the first publish", async () => {
    await setProductStatus("p1", "published");
    expect(state.updates).toHaveLength(1);
    expect(state.updates[0].patch.status).toBe("published");
    expect(typeof state.updates[0].patch.published_at).toBe("string");
  });

  it("keeps the original date when a product is republished", async () => {
    state.row = { published_at: publishedAt, product_variants: active };
    await setProductStatus("p1", "published");
    expect(state.updates[0].patch).toEqual({ status: "published" });
  });

  it("unpublishes even when every variant is switched off", async () => {
    state.row = { published_at: publishedAt, product_variants: [] };
    await setProductStatus("p1", "draft");
    expect(state.updates[0].patch).toEqual({ status: "draft" });
  });

  it("reports a missing product instead of writing", async () => {
    state.row = null;
    await expect(setProductStatus("gone", "published")).rejects.toThrow("no longer exists");
    expect(state.updates).toEqual([]);
  });
});
