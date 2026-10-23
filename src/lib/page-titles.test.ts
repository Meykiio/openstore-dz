import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { translate, type TranslationKey } from "./i18n";

const ROUTES = join(process.cwd(), "src", "routes");
// The owner's screens are written for the owner, so their titles stay Arabic.
const OWNER_ONLY = /^(admin|login|setup)/;
const ARABIC = /[؀-ۿ]/;

describe("storefront page titles", () => {
  it("are never hardcoded Arabic, so an English or French visitor does not get an Arabic tab", () => {
    const offenders = readdirSync(ROUTES)
      .filter((file) => file.endsWith(".tsx") && !OWNER_ONLY.test(file))
      .flatMap((file) =>
        readFileSync(join(ROUTES, file), "utf8")
          .split("\n")
          .filter((line) => /\b(title|content):\s*"/.test(line) && ARABIC.test(line))
          .map((line) => `${file}: ${line.trim()}`),
      );
    expect(offenders).toEqual([]);
  });

  it("translate to a Latin title in French and English", () => {
    const keys: TranslationKey[] = [
      "nav.products",
      "catalogue.description",
      "checkout.title",
      "order.title",
      "search.title",
    ];
    for (const key of keys) {
      for (const locale of ["fr", "en"] as const) {
        expect(translate(locale, key)).not.toMatch(ARABIC);
      }
    }
  });
});
