import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * The admin shell.
 *
 * The rail is one component serving two patterns: a fixed collapsible rail from
 * 1024px, and an overlay drawer below it. Both are CSS, so a change to the
 * container can silently break one while the other keeps working. These assert
 * the geometry rather than the classes, because a class name that is present and
 * a layout that is correct are not the same thing.
 *
 * Guarded by environment variables so the public suite never needs a credential.
 */
const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;

async function signIn(page: Page) {
  // `networkidle`, not `domcontentloaded`. Clicking submit before hydration runs
  // a native form GET, which lands on `/login?` and never signs in, and the
  // failure looks like a broken login rather than a test that was too early.
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.locator('input[type="email"]').fill(email!);
  await page.locator('input[type="password"]').fill(password!);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/admin/, { timeout: 30_000 });
}

test.describe("admin shell", () => {
  test.skip(!email || !password, "E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD not set");

  test("on a phone the rail is a drawer, and it opens and closes", async ({ page }) => {
    const width = 360;
    await page.setViewportSize({ width, height: 844 });
    await signIn(page);

    const rail = page.locator(".admin-sidebar");
    const box = await rail.boundingBox();
    expect(box).not.toBeNull();
    // Closed means fully off the inline-start edge, not merely narrow.
    expect(box!.x).toBeGreaterThanOrEqual(width - 2);

    // The top bar is the only way in on a phone, so it must be there.
    const open = page.getByRole("button", { name: /menu|قائمة|القائمة/i }).first();
    await expect(open).toBeVisible();
    await open.click();

    await expect.poll(async () => (await rail.boundingBox())?.x ?? -1).toBeLessThan(width - 20);

    // Escape closes an overlay. A phone keyboard is what makes this matter.
    await page.keyboard.press("Escape");
    await expect
      .poll(async () => (await rail.boundingBox())?.x ?? 0)
      .toBeGreaterThanOrEqual(width - 2);
  });

  test("on a desktop the rail collapses to an icon rail and the page follows", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await signIn(page);

    const rail = page.locator(".admin-sidebar");
    const expanded = await rail.boundingBox();
    expect(expanded).not.toBeNull();
    expect(expanded!.width).toBeGreaterThan(200);

    const page_ = page.locator(".admin-page");
    const marginBefore = await page_.evaluate((el) => getComputedStyle(el).marginInlineStart);
    expect(parseFloat(marginBefore)).toBeGreaterThan(200);

    const toggle = page.locator(".admin-collapse-toggle");
    await expect(toggle).toBeVisible();
    await toggle.click();

    // The rail narrows and the content reclaims the space. Both, or the layout
    // is half-collapsed.
    await expect.poll(async () => (await rail.boundingBox())?.width ?? 9999).toBeLessThan(100);

    const marginAfter = await page_.evaluate((el) => getComputedStyle(el).marginInlineStart);
    expect(parseFloat(marginAfter)).toBeLessThan(100);

    // Labels are gone at rail width, so the nav must still be reachable by name.
    await expect(page.locator(".admin-nav-item").first()).toBeVisible();
  });

  test("the rail sits on the inline start edge, which is the right in Arabic", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await signIn(page);

    const dir = await page.locator("html").getAttribute("dir");
    expect(dir).toBe("rtl");

    const box = await page.locator(".admin-sidebar").boundingBox();
    expect(box).not.toBeNull();
    // Arabic reads right to left, so the rail belongs against the right edge.
    // This is the assertion that would catch a `left: 0` port.
    expect(Math.abs(box!.x + box!.width - 1280)).toBeLessThanOrEqual(2);
  });

  test("orders paginate by page, and the queue is a filter", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1000 });
    await signIn(page);

    // The total, not the page size. A page of fifteen and a shop with fifteen look
    // identical without it.
    const total = page.getByTestId("orders-total");
    await expect(total).toBeVisible();
    const allOrders = Number((await total.innerText()).trim());
    expect(allOrders).toBeGreaterThan(0);

    const pager = page.getByTestId("orders-pagination");
    // Scoped to the order list. `main ul > li` also matches the sidebar and the
    // analytics widgets, which made the count meaningless.
    const rows = page.getByTestId("order-list").locator("> li");

    // With more orders than one page, the pager appears and page two is a
    // different set of rows rather than more of the same list.
    if (await pager.isVisible().catch(() => false)) {
      const onPageOne = await rows.count();
      expect(onPageOne).toBeLessThanOrEqual(15);

      await page.getByTestId("orders-pagination-page-2").click();
      await expect.poll(async () => await rows.count()).toBeGreaterThan(0);
      // Still bounded: paging must not append to the previous page.
      expect(await rows.count()).toBeLessThanOrEqual(15);
    }

    // The queue filters server-side, so the total must come back smaller or equal
    // rather than depending on how many rows happened to be loaded.
    await page
      .getByRole("button", { name: /قائمة|file d'appel|queue/i })
      .first()
      .click();
    await expect
      .poll(async () => Number((await total.innerText()).trim()))
      .toBeLessThanOrEqual(allOrders);
  });
});
