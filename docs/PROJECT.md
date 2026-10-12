# PROJECT.md — OpenStore DZ

Project-specific rules and adaptations. These narrow the universal rules in the owner's
master files; they never weaken a `[HARD]` rule.

## Current State

**Updated: 2026-10-12**

| | |
|---|---|
| **Phase** | Sprint 2 written, not yet proven against a live database. |
| **Works** | App builds, serves and renders. Algerian Emerald design tokens in both themes, Arabic-first typography via self-hosted Fraunces/Outfit/IBM Plex Mono with Cairo fallback, `data-theme` switching with a pre-paint bootstrap, RTL as the default. Setup health check reports connected / not configured / unreachable with the exact fix. README with a one-click agent setup prompt in English, Arabic and French. Governance and architecture documentation. |
| **Gate status** | `typecheck` 0, `lint` 0, `test` 0 (19 tests), `build` 0. **`knip` exits 1** with `RangeError: Array buffer allocation failed` — machine memory pressure, not a code fault. It fails identically on a clean checkout of the previous commit, so treat it as environmental until memory is freed. |
| **In progress** | Nothing. |
| **Next** | Run `npx supabase db reset --local` once, then `supabase/verify.sql`, then `npx supabase db advisors`. Then Sprint 3: admin sign-in and store profile. |
| **Blocked on** | Nothing that stops writing code. The schema is unverified, so Sprint 3 UI work should not assume it is correct until the reset runs. |

### Verified commands

```bash
npm run check                       # the one gate, currently red on knip only
npx supabase db reset --local       # applies schema.sql plus seed, from scratch
npx supabase db advisors            # RLS, security and performance review
```

### Schema honesty

`supabase/schema.sql` was written and reviewed, never run end to end. A partial run caught a
real syntax error, and a later read caught two trigger defects that compile cleanly and fail
only on the first real row (`coalesce(new.order_id, old.order_id)` in a DECLARE default, and
`coalesce(new, old)` on composite records). All three are fixed. The rest of the file has not
been executed. `supabase/verify.sql` asserts the 17 properties the schema claims and is the
cheapest way to find whatever is still wrong.

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