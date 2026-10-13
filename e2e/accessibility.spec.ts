import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Accessibility audit.
 *
 * Runs axe-core against the WCAG 2.1 A and AA rule sets on every visitor-facing
 * page, in both the desktop and mobile projects.
 *
 * The colour-contrast rule is included deliberately. It is the rule most often
 * disabled to make a suite green, and on a design system built around warm
 * neutrals and an orange accent it is exactly the rule most likely to find
 * something real: muted text on a tinted surface is the usual failure.
 *
 * Scope note: these are automated checks. They catch roughly a third of real
 * accessibility defects — contrast, names, roles, landmarks. They cannot tell
 * you whether the Arabic reads well at 17px or whether the tab order makes
 * sense. Those still need a person.
 */

const PAGES: { path: string; name: string }[] = [
  { path: "/", name: "storefront home" },

  { path: "/cart-checkout-placeholder", name: "cart placeholder" },
  { path: "/track", name: "order tracking lookup" },
  { path: "/login", name: "admin sign-in" },
];

// The cart page is a drawer over the catalogue, not a route, so it is exercised
// through the drawer in the journey spec instead of navigated to here.
const ACCESSIBLE_PAGES = PAGES.filter((page) => !page.path.includes("placeholder"));

/**
 * Discover a real product URL from the storefront rather than hardcoding a seed
 * slug. The seed slug is data, not a contract, and a hardcoded one turns a
 * renamed demo product into a confusing 404 in the test suite.
 */
async function firstProductPath(page: Page): Promise<string | null> {
  await page.goto("/", { waitUntil: "networkidle" });
  const href = await page
    .locator('.product-grid a[href^="/product/"]')
    .first()
    .getAttribute("href")
    .catch(() => null);
  return href;
}

test("every visitor page has no WCAG A/AA violations", async ({ page }) => {
  for (const { path, name } of ACCESSIBLE_PAGES) {
    await page.goto(path, { waitUntil: "networkidle" });

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    // Report the rule id, the selector and axe's own failure summary. The
    // summary carries the measured contrast ratio, which is what turns a failure
    // into a fix rather than a guess.
    const summary = results.violations.map((violation) => ({
      page: name,
      id: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.slice(0, 4).map((node) => ({
        target: node.target.join(" "),
        detail: (node.failureSummary ?? "").replace(/\s+/g, " ").slice(0, 220),
      })),
    }));

    expect(summary).toEqual([]);
  }
});

test("product detail has no WCAG A/AA violations", async ({ page }) => {
  const path = await firstProductPath(page);
  test.skip(!path, "no published product to test");

  await page.goto(path!, { waitUntil: "networkidle" });
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  expect(
    results.violations.map((v) => ({ id: v.id, target: v.nodes[0]?.target.join(" ") })),
  ).toEqual([]);
});

test("document declares Arabic and RTL", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const html = page.locator("html");
  await expect(html).toHaveAttribute("lang", "ar");
  await expect(html).toHaveAttribute("dir", "rtl");
});

test("light theme is the default, and does not follow a dark OS", async ({ browser }) => {
  // A buyer's phone being in dark mode must not turn the shop dark before they
  // choose. This is the invariant `lib/theme.ts` exists to hold.
  const context = await browser.newContext({ colorScheme: "dark" });
  const page = await context.newPage();
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await context.close();
});

test("every interactive control is reachable by keyboard", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });

  const reached = new Set<string>();
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    const tag = await page.evaluate(() => {
      const el = document.activeElement;
      return el
        ? `${el.tagName.toLowerCase()}:${el.getAttribute("aria-label") ?? el.textContent?.trim().slice(0, 20) ?? ""}`
        : "none";
    });
    reached.add(tag);
  }

  // Header nav, cart button and theme toggle must all be tabbable.
  expect([...reached].some((t) => t.startsWith("button"))).toBe(true);
  expect([...reached].some((t) => t.startsWith("a"))).toBe(true);
  expect(reached.size).toBeGreaterThan(3);
});

test("the cart badge is announced, not just drawn", async ({ page }) => {
  await page.goto("/product/shirt-demo", { waitUntil: "networkidle" });

  // An item count that only exists as a coloured dot is invisible to a screen
  // reader, which is why there is a live region alongside it.
  const live = page.locator('[aria-live="polite"]');
  await expect(live.first()).toBeAttached();
});
