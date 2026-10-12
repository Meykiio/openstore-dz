import { describe, it, expect } from "vitest";
import { __test } from "./index.mjs";

const { countPhysicalLines } = __test;

describe("countPhysicalLines", () => {
  it("counts non-empty lines", () => {
    expect(countPhysicalLines("a\nb\nc")).toBe(3);
  });

  it("ignores blank lines so padding cannot inflate a file", () => {
    expect(countPhysicalLines("a\n\n   \n\nb")).toBe(2);
  });

  it("counts a single trailing newline as no extra line", () => {
    expect(countPhysicalLines("a\nb\n")).toBe(2);
  });

  it("returns zero for an empty string", () => {
    expect(countPhysicalLines("")).toBe(0);
  });

  it("returns one for whitespace-free single line content", () => {
    expect(countPhysicalLines("export const a = 1;")).toBe(1);
  });
});