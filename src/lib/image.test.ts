import { describe, expect, it } from "vitest";
import { PRODUCT_ASPECT, cropRect } from "./image";

describe("upload crop", () => {
  it("keeps the whole photo without a frame", () => {
    expect(cropRect(1080, 1920)).toEqual({ sx: 0, sy: 0, cw: 1080, ch: 1920 });
  });

  it("cuts a tall phone photo to 4:5 at the chosen part", () => {
    const frame = (focus: number) => cropRect(1080, 1920, { aspect: PRODUCT_ASPECT, focus });
    expect(frame(0)).toEqual({ sx: 0, sy: 0, cw: 1080, ch: 1350 });
    expect(frame(0.5)).toEqual({ sx: 0, sy: 285, cw: 1080, ch: 1350 });
    expect(frame(1)).toEqual({ sx: 0, sy: 570, cw: 1080, ch: 1350 });
  });

  it("trims a wide photo evenly on both sides", () => {
    expect(cropRect(4000, 3000, { aspect: 1, focus: 0 })).toEqual({
      sx: 500,
      sy: 0,
      cw: 3000,
      ch: 3000,
    });
  });
});
