import { describe, expect, it } from "vitest";
import { WILAYAS, carrierWilaya } from "./wilayas";

describe("wilayas", () => {
  it("lists the 69 wilayas, numbered 1 to 69", () => {
    expect(WILAYAS).toHaveLength(69);
    expect(WILAYAS.map((w) => w.code)).toEqual(Array.from({ length: 69 }, (_, i) => i + 1));
    expect(WILAYAS.find((w) => w.code === 59)?.fr).toBe("Aflou");
    expect(WILAYAS.find((w) => w.code === 69)?.fr).toBe("El Abiodh Sidi Cheikh");
  });

  it("sends the carrier the parent of a 2026 wilaya, and every other name as is", () => {
    expect(carrierWilaya("Aflou")).toBe("Laghouat");
    expect(carrierWilaya("Messaad")).toBe("Djelfa");
    expect(carrierWilaya("Bou Saada")).toBe("M'Sila");
    expect(carrierWilaya("Alger")).toBe("Alger");
  });
});
