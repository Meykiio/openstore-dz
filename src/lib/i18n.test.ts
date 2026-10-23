import { describe, expect, it } from "vitest";
import { localeBootstrapScript, pickLocale } from "./i18n";

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

/** Run the inline script against a fake document and return what it set on <html>. */
function runBootstrap(cookie: string, stored: string | null, html: Record<string, string>) {
  const document = {
    cookie,
    documentElement: { setAttribute: (k: string, v: string) => (html[k] = v) },
  };
  const localStorage = { getItem: () => stored };
  new Function("document", "localStorage", localeBootstrapScript)(document, localStorage);
  return html;
}

describe("localeBootstrapScript", () => {
  it("leaves the server's lang and dir alone on a first visit with nothing stored", () => {
    // Regression: it used to force Arabic, so an English visitor got RTL text.
    const html = runBootstrap("", null, { lang: "en", dir: "ltr" });
    expect(html).toEqual({ lang: "en", dir: "ltr" });
  });

  it("prefers the cookie over the stored choice", () => {
    const html = runBootstrap("a=1; openstore-locale=fr", "ar", {});
    expect(html).toEqual({ lang: "fr", dir: "ltr" });
  });

  it("falls back to the stored choice, and sets rtl for Arabic", () => {
    expect(runBootstrap("", "ar", {})).toEqual({ lang: "ar", dir: "rtl" });
  });
});
