import { beforeEach, describe, expect, it, vi } from "vitest";

/*
 * The transition writes to Supabase, so the client is replaced with a recorder:
 * these tests care about what would be written, not about the network.
 */
const state = vi.hoisted(() => ({
  row: null as { published_at: string | null; product_variants: { is_active: boolean }[] } | null,
  writes: [] as { patch: Record<string, unknown>; conditional: boolean }[],
  /** Whether the conditional first-publication update still matched the row. */
  stampApplies: true,
  error: null as { message: string } | null,
}));

vi.mock("./supabase/client", () => {
  const update = (patch: Record<string, unknown>) => ({
    eq: () => {
      const record = (conditional: boolean) => {
        state.writes.push({ patch, conditional });
        return { error: null as { message: string } | null };
      };
      return {
        // The first-publication path narrows the row with `published_at is null`.
        is: () => ({
          select: async () => {
            record(true);
            return { data: state.stampApplies ? [{ id: "p1" }] : [], error: null };
          },
        }),
        // The plain status path is awaited directly.
        then: (resolve: (value: { error: { message: string } | null }) => unknown) =>
          Promise.resolve(record(false)).then(resolve),
      };
    },
  });

  return {
    getSupabase: () => ({
      from: () => ({
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: state.row, error: state.error }) }),
        }),
        update,
      }),
    }),
  };
});

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
  state.writes = [];
  state.stampApplies = true;
  state.error = null;
});

describe("setProductStatus", () => {
  it("refuses to publish with no active variants, and writes nothing", async () => {
    state.row = { published_at: null, product_variants: [{ is_active: false }] };
    await expect(setProductStatus("p1", "published")).rejects.toBeInstanceOf(
      ProductCannotPublishError,
    );
    expect(state.writes).toEqual([]);
  });

  it("stamps published_at in the same statement as the first publish", async () => {
    await setProductStatus("p1", "published");
    expect(state.writes).toHaveLength(1);
    expect(state.writes[0].conditional).toBe(true);
    expect(state.writes[0].patch.status).toBe("published");
    expect(typeof state.writes[0].patch.published_at).toBe("string");
  });

  it("keeps the original date when a product is republished", async () => {
    state.row = { published_at: publishedAt, product_variants: active };
    await setProductStatus("p1", "published");
    expect(state.writes).toEqual([{ patch: { status: "published" }, conditional: false }]);
  });

  it("keeps the winner's date when two first-publishes race", async () => {
    // The other request stamped the row first, so the conditional write matches
    // nothing and only the status is written.
    state.stampApplies = false;
    await setProductStatus("p1", "published");
    expect(state.writes).toHaveLength(2);
    expect(state.writes[0].conditional).toBe(true);
    expect(state.writes[0].patch.published_at).toEqual(expect.any(String));
    expect(state.writes[1]).toEqual({ patch: { status: "published" }, conditional: false });
  });

  it("unpublishes even when every variant is switched off", async () => {
    state.row = { published_at: publishedAt, product_variants: [] };
    await setProductStatus("p1", "draft");
    expect(state.writes).toEqual([{ patch: { status: "draft" }, conditional: false }]);
  });

  it("reports a missing product instead of writing", async () => {
    state.row = null;
    await expect(setProductStatus("gone", "published")).rejects.toThrow("no longer exists");
    expect(state.writes).toEqual([]);
  });
});
