# PROJECT.md — OpenStore DZ

Project-specific rules and adaptations. These narrow the universal rules in the owner's
master files; they never weaken a `[HARD]` rule.

## Current State

**Updated: 2026-10-14**

|                 |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Phase**       | Phases 0 to 8 built. Phase A (make it work end to end) complete. Sprint B1 (storefront depth) complete. Phase D0 (dashboard) complete. Phase B3 (WhatsApp ordering) complete.                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Works**       | Buyer: home, category pages, search, filter and sort, product page with variants, reviews and size guide, cart, cash-on-delivery checkout, WhatsApp ordering, order tracking. Arabic, French and English, installable PWA, light default. Owner: first-run claim, dashboard with the call queue, analytics and refusal rate by wilaya, product and variant management with photo upload from a phone, packs, size guides, review moderation, delivery zones, Guepex parcel creation. Stock decrements atomically and restocks on refusal. Selling rules are enforced in the database. Secrets are server-only and verified absent from the client bundle. |
| **Gate status** | `npm run check` green: typecheck 0, lint 0, unit tests pass, knip clean, build 0. `npm audit`: 0 vulnerabilities. Accessibility: axe WCAG 2.1 A/AA clean on visitor pages. Responsive: no overflow at 320 to 1280 against the built output, including the admin routes. Playwright: 36 passed.                                                                                                                                                                                                                                                                                                                                                            |
| **In progress** | Nothing. Tree clean.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Next**        | Phase B, the Algeria-specific gaps. Stopdesk pickup first: Guepex charges less for it and many buyers prefer it, so not offering it means either overcharging or absorbing the difference. Then the commune picker, sale prices and the delivered-cost preview. Details and reasons in `docs/ROADMAP.md`.                                                                                                                                                                                                                                                                                                                                                 |
| **Blocked on**  | Three human steps, none of which an agent can do. 1) **The admin password equals the admin email address.** That is survivable on a local build and not on a deployed shop, because anyone who knows the email can sign in. Change it before this is public. 2) `GUEPEX_WEBHOOK_SECRET` is a carrier-dashboard secret; until it is set the webhook returns 503 by design. 3) The demo catalogue uses external `picsum.photos` images and must be replaced with real uploaded media.                                                                                                                                                                       |

### Verified commands

```bash
npm run check                       # the one gate: typecheck, lint, test, knip, build
npm run test:e2e                    # Playwright against the dev server
E2E_BASE_URL=http://127.0.0.1:3000 npm run test:e2e   # against the built output
npx supabase db advisors            # ran both classes; findings fixed
npx supabase gen types typescript --project-id <project-ref> \
  > src/lib/supabase/types.ts       # regenerate after any schema change
```

**Run the browser suite against the built output, not the dev server.** In `vite dev`
the stylesheet is injected by JavaScript during hydration, so for a window the page is
unstyled. Any layout measurement taken there is a measurement of the loader. This is the
same reason no performance number may come from the dev server.

The authenticated layout audit is skipped unless `E2E_ADMIN_EMAIL` and
`E2E_ADMIN_PASSWORD` are set. Use a throwaway account, never your own.

### Database

Project ref: it lives in `.env` as `VITE_SUPABASE_PROJECT_ID` and is deliberately not
written down here, because this repository is public and will be forked. Credentials live
in `.env`, which is gitignored and never committed. The schema is one file,
`supabase/schema.sql`, with no migrations by design — see `docs/DECISIONS.md` entry 4. It
has been applied to the live project through the MCP `apply_migration` tool and verified by
hand; `supabase/verify.sql` is the regression net.

Four defects were found during verification, two of which compiled cleanly and would have
surfaced as a mysterious checkout failure on the first real order. They are itemised in
`docs/DATABASE.md`.

## What this project is

A free, self-hosted e-commerce platform for Algerian small businesses and
individuals. One shop per installation. Cash on delivery first. Arabic RTL.

It is not a marketplace. There is no shared catalogue, no cross-shop discovery,
and the platform never holds a shop owner's money.

## The three flows this product exists for

1. **A shop owner sets up a working shop** by pasting one prompt into an AI
   agent. No paid tier, no onboarding call, no setup invoice.
2. **A buyer browses, customises and orders** on cash on delivery, in Arabic,
   on a phone.
3. **The owner confirms the order by phone, hands it to Guepex, and tracks it.**

## Why the confirmation call and the size guide are not optional

These two features are the business, not polish. Both numbers come from
2026 research on the Algerian market:

- COD refusal runs 15–20% in the big cities and over 30% in the south. One
  refusal costs 600–1,000 DZD plus 7–15 days of locked stock. A
  pre-dispatch confirmation call cuts refusals by 25–35%. It is also the
  single most requested feature by Algerian merchants.
- Fashion returns run **35–50% without a size guide** and **8–15% with one**.
  The size guide builder ships with product management, not later.

## Stack

React 19 · TypeScript · Vite 7 · TanStack Start (SSR via Nitro, Vercel preset) ·
Tailwind CSS v4 (CSS-first, tokens in `src/styles.css`) · shadcn-style primitives ·
TanStack Query · Supabase (Postgres + Auth + Storage + Edge Functions) · AGPL-3.0.

## Project-specific adaptations

| Master rule                                                   | Adaptation                                                                                                  | Reason                                                                                                                                                                                     |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `RULES.md` 7.1 — every schema change is a versioned migration | **One `supabase/schema.sql`, no migrations**                                                                | A shop owner installs this with an agent pasting one file. Twenty migration files is the single biggest setup failure mode. The schema file is the source of truth and is edited directly. |
| `RULES.md` 5.1 — max 250 lines per file                       | Exempt: `supabase/schema.sql`, `src/styles.css`                                                             | Each is one addressable unit whose integrity depends on not being split. The exemption is a closed list; a new file is not exempt for being similar.                                       |
| `System Instructions` Tier 1 gate — `pnpm check`              | **`npm run check`**                                                                                         | Node/npm toolchain. Same contents.                                                                                                                                                         |
| `System Instructions` — ESLint `max-lines`                    | Local rule in `eslint-rules/index.mjs`                                                                      | No maintained npm package exists for ESLint 9 flat config. Owning it means the 250-line rule cannot drift with a dependency update.                                                        |
| RTL                                                           | **Arabic is the primary language**, French is a translation. `dir="rtl"` is the default, not an option.     | Algeria.                                                                                                                                                                                   |
| `RULES.md` 6.5 — rate limit public and abuse-prone operations | **Not implemented.** The order route has input validation and database-level constraints but no rate limit. | Recorded as a real gap rather than assumed away. See `docs/LATER.md`.                                                                                                                      |

## Money

The platform never holds a shop owner's money. The courier collects cash from
the buyer and remits to the owner. Optional card payments, if a shop enables
them, run against that shop's own payment-provider account.

This is a deliberate constraint, not a missing feature. No Algerian payment
provider supports split payouts or sub-merchant settlement, and a foreign
entity cannot obtain a CIB or Edahabia merchant ID without Algerian
registration. Any design that intermediates the money is illegal or
unbuildable here.

## Licence

AGPL-3.0-only. The only OSI-approved licence that prevents someone running a
closed hosted fork of this platform.
