# PROJECT.md — OpenStore DZ

Project-specific rules and adaptations. These narrow the universal rules in the owner's
master files; they never weaken a `[HARD]` rule.

## Current State

**Updated: 2026-10-12**

| | |
|---|---|
| **Phase** | Sprint 2 complete and verified against the live database. Sprint 3 next. |
| **Works** | The database is applied and exercised. 9 tables, RLS plus grants on every one, 16 policies, 9 functions, 4 storage policies, one public bucket, and a demo shop that renders with two products and two approved reviews. `place_order` prices an order from the catalogue server-side and rolls back whole on a bad line; `track_order` answers only to a valid token. `anon` holds no privileges on `orders`. TypeScript types are generated from the live schema and committed. App side: builds, serves, renders; Algerian Emerald tokens, Arabic-first typography, `data-theme` switching, RTL default; setup health check; three-language READMEs. |
| **Gate status** | `typecheck` 0, `lint` 0, `test` 0 (19 tests). **`knip` exits 1** with `RangeError: Array buffer allocation failed` from machine memory pressure — it fails identically on an untouched checkout of an earlier commit, so it is environmental, not a code fault. |
| **In progress** | Nothing. |
| **Next** | **Sprint 3** — admin sign-in and store profile. Add `admin_users` for the owner, Then the settings screen with the Algerian legal disclosure fields. |
| **Blocked on** | Nothing. |

### Verified commands

```bash
npm run check                       # the one gate, currently red on knip only
npx supabase db advisors            # ran both classes; findings fixed
npx supabase gen types typescript --project-id zupldepebwdasoziwjyt \
  > src/lib/supabase/types.ts       # regenerate after any schema change
```

### Database

Project ref `zupldepebwdasoziwjyt`. Credentials live in `.env`, which is gitignored and
never committed. The schema is one file, `supabase/schema.sql`, with no migrations by
design — see `docs/DECISIONS.md` entry 4. It has been applied to the live project through
the MCP `apply_migration` tool and verified by hand; `supabase/verify.sql` is the
regression net.

Four defects were found during verification, two of which compiled cleanly and would have
surfaced as a mysterious checkout failure on the first real order. They are itemised in
`docs/DATABASE.md`.

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