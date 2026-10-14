import { describe, expect, it } from "vitest";
import { waLink, waNumber } from "./whatsapp";

/**
 * The leading-zero case is the one that matters. An owner types `0555123456`
 * because that is how the number is written in Algeria, and `wa.me` cannot use
 * it. A link that silently fails to resolve is worse than no button.
 */
describe("waNumber", () => {
  it("converts the local form with a trunk zero", () => {
    expect(waNumber("0555123456")).toBe("213555123456");
    expect(waNumber("0555 12 34 56")).toBe("213555123456");
  });

  it("converts a bare nine-digit subscriber number", () => {
    expect(waNumber("555123456")).toBe("213555123456");
  });

  it("leaves an already international number untouched", () => {
    expect(waNumber("213555123456")).toBe("213555123456");
    expect(waNumber("+213 555 12 34 56")).toBe("213555123456");
    expect(waNumber("+213555123456")).toBe("213555123456");
  });

  it("keeps a foreign country code rather than prefixing 213", () => {
    // A shop owner abroad still needs a working link. Guessing 213 here would
    // silently point at an Algerian number that is not theirs.
    expect(waNumber("+33 6 12 34 56 78")).toBe("33612345678");
  });

  it("returns null for anything that cannot be a number", () => {
    expect(waNumber(null)).toBeNull();
    expect(waNumber(undefined)).toBeNull();
    expect(waNumber("")).toBeNull();
    expect(waNumber("   ")).toBeNull();
    expect(waNumber("123")).toBeNull();
    expect(waNumber("not a number")).toBeNull();
  });

  it("does not turn a lone trunk zero into a number", () => {
    expect(waNumber("0")).toBeNull();
    expect(waNumber("0123")).toBeNull();
  });
});

describe("waLink", () => {
  it("builds a link with no query when there is no text", () => {
    expect(waLink("0555123456")).toBe("https://wa.me/213555123456");
    expect(waLink("0555123456", "   ")).toBe("https://wa.me/213555123456");
  });

  it("encodes the message, including Arabic and newlines", () => {
    const link = waLink("0555123456", "مرحبا\nقميص");
    expect(link).toContain("https://wa.me/213555123456?text=");
    expect(link).toContain(encodeURIComponent("مرحبا\nقميص"));
    // A raw newline would truncate the URL in some clients.
    expect(link).not.toContain("\n");
  });

  it("returns null instead of a link with no number", () => {
    expect(waLink(null, "hi")).toBeNull();
    expect(waLink("", "hi")).toBeNull();
  });
});
