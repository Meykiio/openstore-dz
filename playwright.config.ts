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
  // The dev and preview servers are single Node processes. Against a built
  // preview, `networkidle` on a Supabase-backed route can take tens of seconds,
  // so both the timeout and the worker count are relaxed for that case rather
  // than left to fail intermittently and be mistaken for a page bug.
  timeout: process.env.E2E_BASE_URL ? 120_000 : 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : process.env.E2E_BASE_URL ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],

  use: {
    // Point at an already-running server with E2E_BASE_URL to test the built
    // output. That matters for layout: in `vite dev` the stylesheet is injected
    // by JS during hydration, so there is a window where the page is unstyled
    // and measurements are about the loader rather than the layout.
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:8080",
    // Pin the browser locale to Algerian Arabic. The app auto-detects the
    // visitor's language, so without this Playwright's default en-US renders the
    // English UI and every Arabic assertion misses. Arabic is the default
    // experience and the one that matters, so it is the one under test.
    locale: "ar-DZ",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    // Self-managing specs: these set their own viewport and sign in, so running
    // them in both device projects would do the same work twice. The project is
    // named for the largest of them; it is really "specs that manage their own
    // context".
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /(responsive|admin-shell|cart-drawer|admin-export)\.spec\.ts/,
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
      testIgnore: /(responsive|admin-shell|cart-drawer|admin-export)\.spec\.ts/,
    },
    {
      name: "responsive",
      testMatch: /(responsive|admin-shell|cart-drawer|admin-export)\.spec\.ts/,
    },
  ],

  // An externally supplied base URL means a server is already running; starting
  // a second one would test the wrong thing.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: "http://127.0.0.1:8080",
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        stdout: "ignore",
        stderr: "pipe",
      },
});
