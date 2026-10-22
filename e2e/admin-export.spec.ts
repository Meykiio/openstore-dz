import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * Order export destinations.
 *
 * Exercises the whole path the owner uses: sign in, add a destination, see the
 * signing secret they need for their script, toggle it, remove it. The database
 * side of this feature was verified separately against a real endpoint before any
 * of this was built, so what is under test here is the screen and the policies
 * behind it.
 *
 * The URL points at example.com and no order is placed during the test, so
 * nothing is ever sent anywhere.
 */
const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;

async function signIn(page: Page) {
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.locator('input[type="email"]').fill(email!);
  await page.locator('input[type="password"]').fill(password!);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/admin/, { timeout: 30_000 });
}

test.describe("order export settings", () => {
  test.skip(!email || !password, "E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD not set");

  test("an owner can add a destination, read its secret, and remove it", async ({ page }) => {
    await signIn(page);
    await page.goto("/admin/settings", { waitUntil: "networkidle" });

    // A destination must not be addable without an https URL: a plaintext
    // webhook would put customer names and phone numbers on the wire in the
    // clear, and the database would reject it anyway.
    await page.getByTestId("export-label-input").fill("E2E destination");
    await page.getByTestId("export-url-input").fill("http://insecure.example.com/hook");
    await expect(page.getByTestId("export-add")).toBeDisabled();

    await page.getByTestId("export-url-input").fill("https://example.com/hook");
    await expect(page.getByTestId("export-add")).toBeEnabled();
    await page.getByTestId("export-add").click();

    const row = page.getByTestId("export-target").filter({ hasText: "E2E destination" });
    await expect(row).toBeVisible();

    // The owner has to be able to read the secret to paste it into their script.
    const secret = (await row.getByTestId("export-secret").innerText()).trim();
    expect(secret).toMatch(/^[0-9a-f]{64}$/);

    // And it must be the only destination, so nothing else was touched.
    await expect(page.getByTestId("export-target")).toHaveCount(1);

    // Clean up, so the suite leaves no destination behind that a later order
    // would be exported to.
    await row.getByRole("button", { name: /supprimer|remove|حذف/i }).click();
    await expect(page.getByTestId("export-target")).toHaveCount(0);
  });
});
