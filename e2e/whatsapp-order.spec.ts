import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * The WhatsApp order path.
 *
 * This exists because the link was wrong in a way that is invisible: the footer
 * built `wa.me/${digits}` straight from the stored number, so an owner who typed
 * their number the way it is written in Algeria (`0555123456`) produced a link
 * that opened WhatsApp and resolved to nothing. Nobody notices until a buyer is
 * lost, which is the worst kind of broken.
 *
 * WhatsApp is a primary order channel in Algeria rather than a fallback, so the
 * link is worth an assertion.
 */

async function firstProductPath(page: Page): Promise<string | null> {
  await page.goto("/", { waitUntil: "networkidle" });
  return page
    .locator('.product-grid a[href^="/product/"]')
    .first()
    .getAttribute("href")
    .catch(() => null);
}

test("the product page offers a WhatsApp order link that resolves", async ({ page }) => {
  const path = await firstProductPath(page);
  test.skip(!path, "no published product to test");

  await page.goto(path!, { waitUntil: "networkidle" });

  const link = page.locator('a[href^="https://wa.me/"]').first();
  await expect(link).toBeVisible();

  const href = (await link.getAttribute("href")) ?? "";

  // The number must be digits only after the host: no plus, no trunk zero. A
  // leading zero is exactly the bug this test exists to catch.
  expect(href).toMatch(/^https:\/\/wa\.me\/\d+(\?text=[\s\S]+)?$/);
  const number = href.replace("https://wa.me/", "").split("?")[0];
  expect(number.startsWith("0")).toBe(false);

  // Opening in a new tab must not hand the opener to the target.
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", /noopener/);
});

test("the WhatsApp message carries the product and the quantity", async ({ page }) => {
  const path = await firstProductPath(page);
  test.skip(!path, "no published product to test");

  await page.goto(path!, { waitUntil: "networkidle" });

  const href = (await page.locator('a[href^="https://wa.me/"]').first().getAttribute("href")) ?? "";
  const text = decodeURIComponent(href.split("text=")[1] ?? "");

  // The shop owner receiving this needs to know what was wanted without asking.
  expect(text.length).toBeGreaterThan(0);
  expect(text).toMatch(/\d+\s*×/); // "2 × 7 500,00 DZD"
  expect(href).toContain(encodeURIComponent(path!));
});

test("the footer WhatsApp link is normalised too", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });

  const link = page.locator('footer a[href^="https://wa.me/"]').first();
  test.skip((await link.count()) === 0, "shop has no WhatsApp number configured");

  const href = (await link.getAttribute("href")) ?? "";
  expect(href).toMatch(/^https:\/\/wa\.me\/\d+$/);
  expect(href.replace("https://wa.me/", "").startsWith("0")).toBe(false);
});
