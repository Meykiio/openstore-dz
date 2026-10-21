import { describe, expect, it } from "vitest";
import { saleOf } from "./sale";

describe("saleOf", () => {
  it("reports the original price and the rounded discount", () => {
    expect(saleOf({ price: 2800, compare_at_price: 3500 })).toEqual({ was: 3500, percent: 20 });
  });

  it("claims no sale when the original is missing, equal or lower", () => {
    expect(saleOf({ price: 2800, compare_at_price: null })).toBeNull();
    expect(saleOf({ price: 2800, compare_at_price: 2800 })).toBeNull();
    expect(saleOf({ price: 2800, compare_at_price: 2000 })).toBeNull();
  });
});
