import { describe, expect, it } from "vitest";
import type { StoreSettings } from "./store-settings";
import { isValidDzPhone, setupGaps, zonesFor } from "./setup-status";

const demo = {
  name: "OpenStore DZ",
  phone: "+213 555 00 00 00",
  whatsapp: "+21355500000000",
  legal_name: "Demo SARL",
  nif: "000000000000000",
  rc_number: "00/00-0000000",
} as StoreSettings;

describe("setupGaps", () => {
  it("flags every demo detail a fresh install ships with", () => {
    expect(setupGaps(demo, 0)).toEqual(["name", "phone", "whatsapp", "delivery", "legal"]);
  });

  it("is empty for a shop with real details", () => {
    const real = {
      ...demo,
      name: "Boutique Amel",
      phone: "0555 12 34 56",
      whatsapp: "0555123456",
      nif: "001216098765432",
      rc_number: "16/00-1234567B21",
    } as StoreSettings;
    expect(setupGaps(real, 58)).toEqual([]);
  });
});

describe("isValidDzPhone", () => {
  it("accepts local and international mobile numbers", () => {
    expect(isValidDzPhone("0555 12 34 56")).toBe(true);
    expect(isValidDzPhone("+213 661 23 45 67")).toBe(true);
    expect(isValidDzPhone("12345678")).toBe(false);
  });
});

describe("zonesFor", () => {
  it("prices all 58 wilayas in two tiers", () => {
    const zones = zonesFor(600, 1200);
    expect(zones).toHaveLength(58);
    expect(zones.find((z) => z.wilaya === "Alger")?.fee).toBe(600);
    expect(zones.find((z) => z.wilaya === "Tamanrasset")?.fee).toBe(1200);
  });
});
