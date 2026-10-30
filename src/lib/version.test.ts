import { describe, expect, it } from "vitest";
import { isNewer } from "./version";

describe("isNewer", () => {
  it("compares x.y.z numerically", () => {
    expect(isNewer("0.2.0", "0.1.0")).toBe(true);
    expect(isNewer("0.10.0", "0.9.3")).toBe(true);
    expect(isNewer("1.0.0", "0.99.99")).toBe(true);
  });

  it("is false for the same or an older version", () => {
    expect(isNewer("0.2.0", "0.2.0")).toBe(false);
    expect(isNewer("0.1.9", "0.2.0")).toBe(false);
    expect(isNewer("garbage", "0.2.0")).toBe(false);
  });
});
