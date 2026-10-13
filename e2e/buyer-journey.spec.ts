import { test, expect } from "@playwright/test";

/**
 * The buyer journey, end to end.
 *
 * Browse → product → add to cart → check out → receive a token → track the order.
 *
 * This test WRITES A REAL ROW to the orders table, because the whole point of
 * the flow is the database-side pricing and the token. It names the customer
 * `E2E-TEST` so the rows are identifiable, and `npm run test:e2e:cleanup` removes
 * them. Skipping the write would leave the most failure-prone step — the
 * `place_order` transaction against live RLS — untested.
 */

const CUSTOMER = "E2E-TEST";
const PHONE = "0555111222";

test.describe("buyer journey", () => {
  test("browse, add to cart, check out, and track the order", async ({ page }) => {
    // 1. Catalogue
    await page.goto("/", { waitUntil: "networkidle" });
    const firstProduct = page.locator('.product-grid a[href^="/product/"]').first();
    await expect(firstProduct).toBeVisible();
    const productPath = await firstProduct.getAttribute("href");
    expect(productPath).toBeTruthy();

    // 2. Product page
    await page.goto(productPath!, { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toBeVisible();

    // 3. Add to cart — the button only renders when stock exists.
    const addToCart = page.getByRole("button", { name: /أضف إلى السلة/ });
    await expect(addToCart).toBeVisible();
    await addToCart.click();

    // The drawer opens itself on add, so the buyer sees what they did.
    const drawer = page.locator("dialog[open]");
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole("heading", { name: /سلة التسوق/ })).toBeVisible();

    // 4. Checkout
    await drawer.getByRole("link", { name: /إتمام الطلب/ }).click();
    await expect(page).toHaveURL(/\/checkout$/);

    await page.getByLabel(/الاسم الكامل/).fill(CUSTOMER);
    await page.getByLabel(/رقم الهاتف/).fill(PHONE);
    await page.getByLabel(/^الولاية/).selectOption({ index: 1 });
    await page.getByLabel(/العنوان الكامل/).fill("10 rue des tests, Alger");

    await page.getByRole("button", { name: /تأكيد الطلب/ }).click();

    // 5. Confirmation — the token is the buyer's only handle on the order.
    await expect(page.getByRole("heading", { name: /تم استلام طلبك/ })).toBeVisible({
      timeout: 20_000,
    });

    // 6. Track it
    await page.getByRole("link", { name: /تتبع طلبي/ }).click();
    await expect(page).toHaveURL(/\/order\//);
    await expect(page.getByText(/بانتظار التأكيد/).first()).toBeVisible();
    await expect(page.getByText(CUSTOMER)).toBeVisible();
  });

  test("an invalid phone is rejected by the database, not just the browser", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.locator('.product-grid a[href^="/product/"]').first().click();
    await page.getByRole("button", { name: /أضف إلى السلة/ }).click();
    await page
      .locator("dialog[open]")
      .getByRole("link", { name: /إتمام الطلب/ })
      .click();

    await page.getByLabel(/الاسم الكامل/).fill(CUSTOMER);
    // Bypass the native pattern attribute the way a crafted request would, so
    // this exercises the trigger rather than the browser's own validation.
    await page.getByLabel(/رقم الهاتف/).evaluate((el) => el.removeAttribute("pattern"));
    await page.getByLabel(/رقم الهاتف/).fill("nope");
    await page.getByLabel(/^الولاية/).selectOption({ index: 1 });
    await page.getByLabel(/العنوان الكامل/).fill("10 rue des tests, Alger");

    await page.getByRole("button", { name: /تأكيد الطلب/ }).click();

    // The database's own message must surface, not a generic failure.
    await expect(page.getByRole("alert")).toContainText(/Invalid phone/i, { timeout: 20_000 });
  });

  test("tracking an unknown token says so instead of erroring", async ({ page }) => {
    await page.goto("/order/00000000-0000-4000-8000-000000000000", {
      waitUntil: "networkidle",
    });
    await expect(page.getByText(/لم نجد أي طلب بهذا الرقم/)).toBeVisible();
  });

  test("a malformed token is rejected before it reaches the database", async ({ page }) => {
    await page.goto("/track", { waitUntil: "networkidle" });
    await page.getByLabel(/رقم الطلب/).fill("not-a-uuid");
    await page.getByRole("button", { name: /تتبع/ }).click();
    // A raw ::uuid cast failure would be a Postgres error; the page must not show one.
    await expect(page.getByText(/لم نجد أي طلب بهذا الرقم/)).toBeVisible();
  });
});
