import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * Responsive audit.
 *
 * Horizontal overflow is the defect that makes a phone storefront feel broken:
 * the page can be dragged sideways, the sticky bottom bar detaches from the
 * viewport, and the layout looks like it was never meant for a phone. Algerian
 * buyers are overwhelmingly on phones, and a large share of those are 360px
 * Android devices, not 390px iPhones, so the narrow end is where this is
 * measured first.
 *
 * The check is `scrollWidth > clientWidth` on the document element. That is the
 * only definition that matters, because it is the condition that actually
 * produces the sideways drag. A single wide element inside an `overflow-x-auto`
 * carousel is not a defect, so anything clipped by a scrolling ancestor is
 * excluded rather than reported.
 *
 * These widths are the cheap Android and iPhone sizes in actual use plus the
 * tablet and desktop transitions. 320 is included because it is the floor that
 * still has to work.
 */

const WIDTHS = [320, 360, 390, 414, 768, 1024, 1280];

type Offender = { tag: string; cls: string; left: number; right: number };
type Failure = { route: string; width: number; excess: number; offenders: Offender[] };

const STATIC_ROUTES: { path: string; name: string }[] = [
  { path: "/", name: "home" },
  { path: "/search?q=a", name: "search" },
  { path: "/search", name: "search (empty)" },
  { path: "/track", name: "track" },
  { path: "/login", name: "login" },
  { path: "/checkout", name: "checkout" },
];

const routes: { path: string; name: string }[] = [...STATIC_ROUTES];

/**
 * Discover real product and category URLs from the storefront. Hardcoding a seed
 * slug turns a renamed demo product into a confusing 404 in the suite.
 */
test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  await page.goto("/", { waitUntil: "networkidle" });

  const product = await page
    .locator('.product-grid a[href^="/product/"]')
    .first()
    .getAttribute("href")
    .catch(() => null);
  const category = await page
    .locator('a[href^="/category/"]')
    .first()
    .getAttribute("href")
    .catch(() => null);

  if (product) routes.push({ path: product, name: "product" });
  if (category) routes.push({ path: category, name: "category" });

  await page.close();
});

/**
 * Measure page-level horizontal overflow and name what caused it.
 *
 * Only the shallowest offending element in each chain is reported. A bad
 * container makes every child report too, and a list of twelve descendants of
 * one broken row hides the row that needs fixing.
 */
async function measureOverflow(page: Page, width: number, path: string) {
  await page.setViewportSize({ width, height: 844 });
  await page.goto(path, { waitUntil: "networkidle" });
  // The mobile bottom bar and drawers mount after hydration.
  await page.waitForTimeout(200);

  return page.evaluate(() => {
    const doc = document.documentElement;
    const excess = doc.scrollWidth - doc.clientWidth;
    const offenders: { tag: string; cls: string; left: number; right: number }[] = [];
    if (excess <= 0) return { excess, offenders };

    const viewport = doc.clientWidth;
    const bad = new Set<HTMLElement>();
    for (const el of Array.from(document.querySelectorAll<HTMLElement>("body *"))) {
      const rect = el.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) continue;
      if (rect.right > viewport + 1 || rect.left < -1) bad.add(el);
    }

    const clippedByScroller = (el: HTMLElement) => {
      let parent = el.parentElement;
      while (parent && parent !== doc) {
        const overflowX = getComputedStyle(parent).overflowX;
        if (overflowX !== "visible") return true;
        parent = parent.parentElement;
      }
      return false;
    };

    /**
     * A fixed-position element escapes its ancestors' clipping, so `body`'s
     * `overflow-x: hidden` does not contain it. That is the one case that can
     * still widen the document, and treating it as clipped is how this check
     * once reported an overflow with nothing to point at.
     */
    const escapesClipping = (el: HTMLElement) => getComputedStyle(el).position === "fixed";

    for (const el of bad) {
      if (!escapesClipping(el) && clippedByScroller(el)) continue;

      let covered = false;
      let parent = el.parentElement;
      while (parent) {
        if (bad.has(parent)) {
          covered = true;
          break;
        }
        parent = parent.parentElement;
      }
      if (covered) continue;

      const rect = el.getBoundingClientRect();
      offenders.push({
        tag: el.tagName.toLowerCase(),
        cls: String(el.className || "").slice(0, 90),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
      });
    }

    return { excess, offenders: offenders.slice(0, 8) };
  });
}

for (const width of WIDTHS) {
  test(`no horizontal overflow at ${width}px`, async ({ page }) => {
    const failures: Failure[] = [];

    for (const route of routes) {
      const { excess, offenders } = await measureOverflow(page, width, route.path);
      if (excess > 1) failures.push({ route: route.name, width, excess, offenders });
    }

    expect(failures).toEqual([]);
  });
}

test("touch targets are large enough to hit on a phone", async ({ page }) => {
  // WCAG 2.2 target size minimum is 24px; the practical floor for a thumb on a
  // phone is nearer 44px. Interactive elements are checked against 32px, which
  // is the compromise the storefront is built to.
  await page.setViewportSize({ width: 360, height: 844 });
  await page.goto("/", { waitUntil: "networkidle" });

  const tooSmall = await page.evaluate(() => {
    const MIN = 32;
    const small: { tag: string; cls: string; w: number; h: number }[] = [];
    const selector = "button, a[href], input:not([type=hidden]), select, textarea, [role=button]";

    /**
     * An element the user cannot reach is not a target. The mobile menu is
     * collapsed with `max-h-0` and the cart drawer sits behind `overflow:
     * hidden`, so their contents still have a measured size while being
     * unreachable. Measuring those would demand larger controls inside a box
     * nobody can open.
     */
    const isClipped = (el: HTMLElement) => {
      // Fixed elements are not clipped by their ancestors.
      if (getComputedStyle(el).position === "fixed") return false;

      const own = el.getBoundingClientRect();
      let parent = el.parentElement;
      while (parent && parent !== document.documentElement) {
        const style = getComputedStyle(parent);
        if (style.overflowX !== "visible" || style.overflowY !== "visible") {
          const box = parent.getBoundingClientRect();
          const inside =
            own.top >= box.top - 1 &&
            own.bottom <= box.bottom + 1 &&
            own.left >= box.left - 1 &&
            own.right <= box.right + 1;
          if (!inside) return true;
        }
        parent = parent.parentElement;
      }
      return false;
    };

    for (const el of Array.from(document.querySelectorAll<HTMLElement>(selector))) {
      const rect = el.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) continue;
      const style = getComputedStyle(el);
      if (style.visibility === "hidden" || style.display === "none") continue;
      // Inline text links inside a paragraph are exempt; they are not targets.
      if (el.tagName === "A" && style.display === "inline") continue;
      if (isClipped(el)) continue;
      if (rect.width < MIN || rect.height < MIN) {
        small.push({
          tag: el.tagName.toLowerCase(),
          cls: String(el.className || "").slice(0, 70),
          w: Math.round(rect.width),
          h: Math.round(rect.height),
        });
      }
    }
    return small.slice(0, 15);
  });

  expect(tooSmall).toEqual([]);
});

test("the mobile bottom bar is pinned to the viewport, not to the page", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 844 });
  await page.goto("/", { waitUntil: "networkidle" });

  const bar = page.locator(".bottom-nav").first();
  test.skip((await bar.count()) === 0, "no bottom bar on this route");

  const rect = await bar.boundingBox();
  expect(rect).not.toBeNull();
  // Its bottom edge should sit at the viewport bottom, within a pixel.
  expect(Math.abs(rect!.y + rect!.height) - 844).toBeLessThanOrEqual(2);
});

/**
 * The owner's side of the app, on the phone the owner actually carries.
 *
 * Guarded by environment variables so the public suite never needs a credential.
 * Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run it; without them it is
 * skipped rather than silently passing.
 */
test("the dashboard signs in, renders real figures, and fits a phone", async ({ page }) => {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  test.skip(!email || !password, "E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD not set");

  await page.setViewportSize({ width: 360, height: 844 });
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.locator('input[type="email"]').fill(email!);
  await page.locator('input[type="password"]').fill(password!);
  await page.locator('button[type="submit"]').click();

  await page.waitForURL(/\/admin/, { timeout: 20_000 });

  // The range switcher and the analytics grid only exist once the aggregate
  // query has returned, so their presence proves the dashboard rendered real
  // data rather than an error or a loading state.
  await expect(page.getByTestId("dashboard-range")).toBeVisible();
  await expect(page.getByTestId("dashboard-analytics")).toBeVisible();

  const routes = [
    "/admin",
    "/admin/products",
    "/admin/categories",
    "/admin/welcome",
    "/admin/reviews",
    "/admin/delivery",
    "/admin/settings",
  ];

  for (const width of [360, 1280]) {
    const failures = [];
    for (const route of routes) {
      const { excess, offenders } = await measureOverflow(page, width, route);
      if (excess > 1) failures.push({ route, width, excess, offenders });
    }
    expect(failures).toEqual([]);
  }
});
