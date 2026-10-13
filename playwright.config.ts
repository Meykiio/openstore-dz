import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end and accessibility tests.
 *
 * Runs against the dev server locally and against a fresh one in CI. The dev
 * server is reused when one is already listening, so `npm run test:e2e` does not
 * fight a server you already have open on 8080.
 *
 * Two projects on purpose: the storefront is Arabic-first and mobile-first, so a
 * desktop-only pass would miss the layout that most Algerian buyers actually
 * see. A violation that only appears at 412px is still a violation.
 *
 * Note on performance: this config is about correctness and accessibility. No
 * meaningful performance number can come from `vite dev`, so Lighthouse runs
 * separately against the built output (see `lighthouserc.json`).
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],

  use: {
    baseURL: "http://127.0.0.1:8080",
    // Pin the browser locale to Algerian Arabic. The app auto-detects the
    // visitor's language, so without this Playwright's default en-US renders the
    // English UI and every Arabic assertion misses. Arabic is the default
    // experience and the one that matters, so it is the one under test.
    locale: "ar-DZ",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:8080",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
