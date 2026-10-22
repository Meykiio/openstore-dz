import { describe, expect, it } from "vitest";
import { pickLocale } from "./i18n";

describe("pickLocale", () => {
  it("takes the first supported language, in order", () => {
    expect(pickLocale(["fr-DZ", "ar", "en"])).toBe("fr");
    expect(pickLocale(["de-DE", "en-US"])).toBe("en");
  });

  it("falls back to Arabic when nothing matches", () => {
    expect(pickLocale(["de", "es"])).toBe("ar");
    expect(pickLocale([])).toBe("ar");
  });
});
