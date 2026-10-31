import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * The cart, measured while it is open.
 *
 * The general responsive audit never opens the drawer, so everything below was
 * previously unverified. A `<dialog>` is in the browser's top layer, outside the
 * normal flow, so a page-level overflow check cannot see it either. These assert
 * the drawer's own geometry and what happens inside it.
 */

async function addFirstProductToCart(page: Page, width: number) {
  await page.setViewportSize({ width, height: 844 });
  await page.goto("/", { waitUntil: "networkidle" });

  const product = page.locator('.product-grid a[href^="/product/"]').first();
  // Products are fetched client-side, so the grid can still be empty when
  // `networkidle` resolves. Counting immediately skips the test at some widths
  // and not others, which looks like a width-specific layout bug and is not one.
  await product.waitFor({ state: "attached", timeout: 20_000 }).catch(() => null);
  if ((await product.count()) === 0) {
    test.skip(true, "no published product");
    return;
  }
  await product.click();

  await page
    .getByRole("button", { name: /panier|cart|السلة|أضف/i })
    .first()
    .click();

  // Adding opens the drawer by itself. Only fall back to the header button if it
  // did not, because clicking that while the drawer is already open is blocked by
  // the dialog itself.
  const drawer = page.locator("dialog[open]");
  if (!(await drawer.isVisible().catch(() => false))) {
    await page.getByTestId("cart-open").click();
  }
  await expect(drawer).toBeVisible({ timeout: 10_000 });
  // The sheet slides in; measure where it lands, not where it is mid-slide.
  await drawer.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
}

for (const width of [320, 360, 414, 768]) {
  test(`the cart drawer fits the viewport at ${width}px`, async ({ page }) => {
    await addFirstProductToCart(page, width);

    const drawer = page.locator("dialog[open]");
    const box = await drawer.boundingBox();
    expect(box).not.toBeNull();

    // It may be narrower than the viewport, but never wider, and never off-screen.
    expect(box!.width).toBeLessThanOrEqual(width + 1);
    expect(box!.x).toBeGreaterThanOrEqual(-1);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1);
  });
}

test("the cart drawer does not scroll sideways on a small phone", async ({ page }) => {
  await addFirstProductToCart(page, 320);

  // The dialog is in the top layer, so a document-level check would miss it.
  // This measures the scroller inside the drawer instead.
  const overflow = await page.locator("dialog[open]").evaluate((dialog) => {
    const list = dialog.querySelector("ul");
    if (!list) return 0;
    return list.scrollWidth - list.clientWidth;
  });

  expect(overflow).toBeLessThanOrEqual(1);
});

test("the cart drawer's actions are reachable on a small phone", async ({ page }) => {
  await addFirstProductToCart(page, 320);

  const drawer = page.locator("dialog[open]");
  // Whatever is offered as the next step must actually be on screen and hittable,
  // not pushed below the fold by the item list.
  const action = drawer.locator("a, button").last();
  await expect(action).toBeInViewport();
});
