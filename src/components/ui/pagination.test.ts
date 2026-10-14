import { describe, expect, it } from "vitest";
import { pageWindow } from "./pagination";

/**
 * The window arithmetic is pure and easy to get subtly wrong: a pager that skips
 * page 2, or shows an ellipsis where a real number belongs, is not something
 * anyone notices until they need that exact page.
 */
describe("pageWindow", () => {
  it("lists every page when there are few", () => {
    expect(pageWindow(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageWindow(3, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageWindow(5, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("handles a single page without inventing neighbours", () => {
    expect(pageWindow(1, 1)).toEqual([1]);
  });

  it("keeps the first and last page reachable from the middle", () => {
    const window = pageWindow(10, 20);
    expect(window[0]).toBe(1);
    expect(window[window.length - 1]).toBe(20);
    expect(window).toContain(10);
  });

  it("always includes the current page", () => {
    for (const page of [1, 2, 9, 10, 11, 19, 20]) {
      expect(pageWindow(page, 20)).toContain(page);
    }
  });

  it("shows a gap of one as the number rather than an ellipsis", () => {
    // 1, 2, 3 then a real gap: page 2 must not be hidden behind an ellipsis.
    expect(pageWindow(2, 10)).toEqual([1, 2, 3, null, 10]);
    expect(pageWindow(9, 10)).toEqual([1, null, 8, 9, 10]);
  });

  it("marks a real gap with null", () => {
    expect(pageWindow(5, 10)).toEqual([1, null, 4, 5, 6, null, 10]);
  });

  it("never returns a number outside the range", () => {
    for (const page of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
      for (const entry of pageWindow(page, 10)) {
        if (entry !== null) {
          expect(entry).toBeGreaterThanOrEqual(1);
          expect(entry).toBeLessThanOrEqual(10);
        }
      }
    }
  });

  it("never returns duplicates", () => {
    for (const page of [1, 4, 7, 12, 20]) {
      const numbers = pageWindow(page, 20).filter((entry): entry is number => entry !== null);
      expect(new Set(numbers).size).toBe(numbers.length);
    }
  });
});
