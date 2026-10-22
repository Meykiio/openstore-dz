# End-to-end tests

`npm run test:e2e` runs Playwright against a dev server on port 8080, reusing one
that is already running. Two projects: `desktop` (Chrome) and `mobile` (Pixel 7).
The mobile project is not optional — the storefront is Arabic-first and
mobile-first, and a violation that only appears at 412px is still a violation.

```bash
npm run test:e2e              # everything, both projects
npm run test:e2e:ui           # interactive
npx playwright test --project=mobile
npx playwright test e2e/accessibility.spec.ts
```

## What is covered

| File                    | Covers                                                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| `accessibility.spec.ts` | axe-core WCAG 2.1 A/AA on every visitor page, RTL/lang declaration, light-theme default, keyboard reachability |
| `buyer-journey.spec.ts` | Browse → product → cart → checkout → tracking, plus the two rejection paths                                    |

## These tests write to the database

The buyer journey places a real order. That is deliberate: the most
failure-prone step in the whole flow is the `place_order` transaction against
live RLS, and mocking the database would skip exactly the part worth testing.

Orders are created with the customer name `E2E-TEST` so they are identifiable.
After a local run, remove them:

```sql
delete from public.orders where customer_name = 'E2E-TEST';
```

In CI, run them against a disposable project rather than production. The job
reads `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` and
`VITE_SUPABASE_PROJECT_ID` from repository secrets.

## Two things these tests cannot tell you

- **They are automated checks.** axe catches roughly a third of real
  accessibility defects: contrast, names, roles, landmarks. It cannot tell you
  whether the Arabic reads well at 17px, whether the tab order makes sense, or
  whether the mobile bottom bar sits under a thumb comfortably. Those need a
  person on a phone.
- **They say nothing about performance.** No meaningful performance number can
  come from `vite dev`. Performance has to be measured against a built
  deployment, and has not been measured yet.

## Locale note

The Playwright config pins `locale: "ar-DZ"`. Without it the browser reports
`en-US`, the app's language auto-detection switches to English, and every Arabic
assertion misses. Arabic is the default experience and the one under test.
