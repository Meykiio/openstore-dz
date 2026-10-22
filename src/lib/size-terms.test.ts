import { describe, expect, it } from "vitest";
import { translateHeading } from "./size-terms";

describe("translateHeading", () => {
  it("translates the usual headings and their unit", () => {
    expect(translateHeading("المقاس", "en")).toBe("Size");
    expect(translateHeading("الصدر (سم)", "en")).toBe("Chest (cm)");
    expect(translateHeading("الطول (سم)", "fr")).toBe("Longueur (cm)");
    expect(translateHeading("Chest (cm)", "ar")).toBe("الصدر (سم)");
  });

  it("leaves a heading it does not know as the owner wrote it", () => {
    expect(translateHeading("طول الذراع الكامل", "en")).toBe("طول الذراع الكامل");
  });
});
