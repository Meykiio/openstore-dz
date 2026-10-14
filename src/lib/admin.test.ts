import { describe, expect, it } from "vitest";
import { needsCall, sortOrdersForQueue } from "./admin";
import type { AdminOrder } from "./admin";

/**
 * The ordering exists to stop a confirmed order from appearing to vanish. These
 * tests pin that behaviour rather than the implementation: a confirmed order must
 * still be in the list, just lower down.
 */

function order(id: string, status: AdminOrder["status"], createdAt: string): AdminOrder {
  return {
    id,
    status,
    created_at: createdAt,
    customer_name: `Customer ${id}`,
    phone: "0555123456",
    wilaya: "Alger",
    total: 1000,
    order_items: [],
  } as unknown as AdminOrder;
}

const PENDING = order("p1", "pending", "2026-10-01T10:00:00Z");
const CONFIRMED = order("c1", "confirmed", "2026-10-05T10:00:00Z");
const NEWER_PENDING = order("p2", "pending", "2026-10-03T10:00:00Z");
const DELIVERED = order("d1", "delivered", "2026-10-06T10:00:00Z");

describe("sortOrdersForQueue", () => {
  it("puts orders needing a call first", () => {
    const sorted = sortOrdersForQueue([CONFIRMED, PENDING, DELIVERED]);
    expect(sorted[0].id).toBe("p1");
    expect(needsCall(sorted[0])).toBe(true);
  });

  it("keeps every order, so a confirmed one does not disappear", () => {
    const input = [PENDING, CONFIRMED, DELIVERED];
    const sorted = sortOrdersForQueue(input);
    expect(sorted).toHaveLength(input.length);
    expect(sorted.map((o) => o.id).sort()).toEqual(["c1", "d1", "p1"]);
  });

  it("orders newest first inside each group", () => {
    const sorted = sortOrdersForQueue([PENDING, NEWER_PENDING]);
    expect(sorted.map((o) => o.id)).toEqual(["p2", "p1"]);
  });

  it("filters to the queue when asked, and only then", () => {
    const filtered = sortOrdersForQueue([PENDING, CONFIRMED, NEWER_PENDING], true);
    expect(filtered.map((o) => o.id)).toEqual(["p2", "p1"]);
  });

  it("does not mutate its input", () => {
    const input = [CONFIRMED, PENDING];
    const before = [...input];
    sortOrdersForQueue(input);
    expect(input).toEqual(before);
  });

  it("handles an empty list", () => {
    expect(sortOrdersForQueue([])).toEqual([]);
  });
});
