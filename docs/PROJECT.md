# PROJECT.md — OpenStore DZ

Project-specific rules and adaptations. These narrow the universal rules in the owner's
master files; they never weaken a `[HARD]` rule.

## Current State

**Updated: 2026-10-12**

| | |
|---|---|
| **Phase** | Sprint 1 complete. Sprint 2 next. |
| **Works** | App builds, serves and renders. `npm run check` exits 0: typecheck, ESLint (250-line file / 120-line function limit), 19 Vitest tests, knip dead-code scan, production build. Algerian Emerald design tokens in both themes, Arabic-first typography via self-hosted Fraunces/Outfit/IBM Plex Mono with Cairo fallback, `data-theme` switching with a pre-paint bootstrap, RTL as the default. Setup health check reports connected / not configured / unreachable with the exact fix. Full README with one-click agent setup prompt in English, Arabic and French. Governance and architecture documentation set. |
| **In progress** | Nothing. Working tree clean at the last commit. |
| **Next sprint** | **Sprint 2** — write `supabase/schema.sql`: `store_settings`, `admin_users`, `products`, `product_variants`, `variant_images`, `pack_items`, `orders`, `reviews`; RLS plus base grants; server-side price triggers; `product-media` storage policies; idempotent demo seed shop. |
| **Blocked on** | Nothing. Sprint 2 needs no live database. A Supabase project is only required at Sprint 3. |

### Verified commands

```bash
npm run check     # the one gate. Exits 0.
npx supabase db reset --local   # Sprint 2 onward: applies schema.sql plus seed
npx supabase db advisors        # run after any schema change
```

### Not yet built

The catalogue, checkout, dashboard and Guepex delivery do not exist. Sprints 3 to 8.
`README.md` and `docs/FEATURES.md` both say so explicitly, and both name this project as
v0.1.0 foundation rather than a usable shop. Do not let documentation drift ahead of the
code.

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

| Master rule | Adaptation | Reason |
|---|---|---|
| `RULES.md` 7.1 — every schema change is a versioned migration | **One `supabase/schema.sql`, no migrations** | A shop owner installs this with an agent pasting one file. Twenty migration files is the single biggest setup failure mode. The schema file is the source of truth and is edited directly. |
| `RULES.md` 5.1 — max 250 lines per file | Exempt: `supabase/schema.sql`, `src/styles.css`, `docs/DESIGN_SYSTEM.html` | Each is one addressable unit whose integrity depends on not being split. |
| `System Instructions` Tier 1 gate — `pnpm check` | **`npm run check`** | Node/npm toolchain. Same contents. |
| `System Instructions` — ESLint `max-lines` | Local rule in `eslint-rules/index.mjs` | No maintained npm package exists for ESLint 9 flat config. Owning it means the 250-line rule cannot drift with a dependency update. |
| RTL | **Arabic is the primary language**, French is a translation. `dir="rtl"` is the default, not an option. | Algeria. |

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