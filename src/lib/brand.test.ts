import { describe, expect, it } from "vitest";
import { brandCss, textOn } from "./brand";

describe("brand colour", () => {
  it("puts readable text on light and dark brands", () => {
    expect(textOn("#f5d90a")).toBe("#111111");
    expect(textOn("#1c2a4a")).toBe("#ffffff");
  });

  it("refuses anything that is not a plain hex colour", () => {
    expect(brandCss("red;}body{display:none")).toBeNull();
    expect(brandCss(null)).toBeNull();
    expect(brandCss("#c2410c")).toContain("--primary:#c2410c");
  });
});
