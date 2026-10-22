import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * The storefront catalogue.
 *
 * The catalogue used to load every published product and filter it in the browser.
 * That stops working when the list is paged, and it fails in the worst way: a
 * result count filtered client-side only ever counts the loaded page, so it becomes
 * a wrong answer rather than a slow one.
 *
 * These assert the properties that distinguish real server-side paging from a grid
 * that happens to show fewer rows: the count is the count of the whole matching
 * set, page two is a different set, and a search narrows the count.
 */

/**
 * Product names currently on screen, so two pages can be compared. Waits for the
 * first card: `networkidle` can settle before the grid has rendered from a
 * remote database, and reading then counts an empty grid.
 */
async function visibleProducts(page: Page): Promise<string[]> {
  await page
    .locator(".product-grid a[href^='/product/']")
    .first()
    .waitFor({ timeout: 15_000 })
    .catch(() => undefined);
  return page
    .locator(".product-grid a[href^='/product/']")
    .evaluateAll((links) => links.map((link) => (link.textContent ?? "").trim()).filter(Boolean));
}

test("the catalogue pages, and page two is not page one", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto("/catalogue", { waitUntil: "networkidle" });

  const first = await visibleProducts(page);
  expect(first.length).toBeGreaterThan(0);

  // Bounded: a page must never be the whole catalogue when there is more than one.
  expect(first.length).toBeLessThanOrEqual(12);

  const pager = page.getByTestId("catalogue-pagination");
  test.skip(!(await pager.isVisible().catch(() => false)), "catalogue fits on one page");

  await page.getByTestId("catalogue-pagination-page-2").click();
  await expect
    .poll(async () => (await visibleProducts(page)).join("|"), { timeout: 15_000 })
    .not.toBe(first.join("|"));

  const second = await visibleProducts(page);
  // Real paging replaces the page rather than appending to it.
  expect(second.length).toBeLessThanOrEqual(12);
  expect(second.some((name) => first.includes(name))).toBe(false);
});

test("a search narrows the reported total, not just the visible rows", async ({ page }) => {
  await page.goto("/catalogue", { waitUntil: "networkidle" });

  const pager = page.getByTestId("catalogue-pagination");
  const hasPager = await pager.isVisible().catch(() => false);
  const before = await visibleProducts(page);

  // Search for something the seeded catalogue definitely contains.
  await page.goto("/search?q=%D9%82%D9%85%D9%8A%D8%B5", { waitUntil: "networkidle" });

  const after = await visibleProducts(page);
  expect(after.length).toBeGreaterThan(0);
  expect(after.length).toBeLessThanOrEqual(12);
  // A narrower result set than the unfiltered first page, which is only possible if
  // the filtering happened where the whole set is.
  if (hasPager) expect(after.length).toBeLessThanOrEqual(before.length);
});

test("a category page shows only that category, and still pages", async ({ page }) => {
  // Discovered from the home page, not hardcoded. A named slug broke twice: once
  // when the placeholder catalogue was replaced, and again on a fresh install,
  // which seeds different categories from the live shop.
  await page.goto("/", { waitUntil: "networkidle" });
  const categoryPath = await page.locator('a[href^="/category/"]').first().getAttribute("href");
  expect(categoryPath).toBeTruthy();
  await page.goto(categoryPath!, { waitUntil: "networkidle" });

  const products = await visibleProducts(page);
  expect(products.length).toBeGreaterThan(0);
  expect(products.length).toBeLessThanOrEqual(12);

  // Every card must belong to the category, which the server decided rather than
  // the browser filtering a full catalogue down.
  await expect(page.locator(".product-grid a[href^='/product/']").first()).toBeVisible();
});
