# ARCHITECTURE

## Stack

- **Framework:** TanStack Start v1 (React 19) — file-based routing, SSR, server functions.
- **Build:** Vite 7 with Nitro's `vercel` preset. Output lands in `.vercel/output/`.
- **Styling:** Tailwind CSS v4, CSS-first. Tokens live in `src/styles.css`; there is no
  `tailwind.config.js`.
- **Data:** Supabase (Postgres + Row Level Security + Auth + Storage + Edge Functions).
  No other backend service.
- **Server state:** TanStack Query. There is no separate API service: the browser talks
  to Supabase directly and RLS is the authorization boundary.
- **Deployment:** Vercel, or any Node 20+ host that can run the Nitro SSR entry.

## Request lifecycle

```
Browser
  |
  |  GET /                     SSR by Nitro, rendered on the server
  v
Nitro SSR bundle
  |
  |  React renders. No data is fetched during SSR in v1; pages render their
  |  loading state and TanStack Query fills them in after hydration.
  v
Browser hydrates
  |
  |  supabase-js (publishable key) -> PostgREST -> Postgres
  |  Row Level Security evaluates every row against the caller's role
  v
Postgres
```

The SSR pass exists so product pages can ship real `og:` meta tags in the initial HTML.
That matters because in Algeria a product link is shared on WhatsApp and Facebook, and the
preview card is the storefront. See `docs/DECISIONS.md` entry 3.

## Module boundaries

```
src/
  routes/            file-based routes, one file per screen
    __root.tsx       HTML shell, fonts, providers, theme bootstrap
    index.tsx        storefront home (Sprint 6)
    p/$slug.tsx      product or pack detail (Sprint 6)
    cart.tsx         cart (Sprint 7)
    checkout.tsx     cash-on-delivery checkout (Sprint 7)
    order/$token.tsx public order tracking (Sprint 7)
    admin/           dashboard (Sprints 3 to 5)

  components/
    ui/              vendored primitives, shadcn-style
    setup-check.tsx  first-run health check
    theme-toggle.tsx

  lib/
    supabase/client.ts   browser client, publishable key only
    supabase/health.ts   reachability probe
    theme.ts             data-theme handling, pre-paint bootstrap script
    utils.ts             cn()

  styles.css         all design tokens, both themes

supabase/
  schema.sql         the entire database: tables, RLS, grants, triggers,
                     storage policies and demo seed data. Single file, no migrations.
  functions/         Edge Functions, currently only the Guepex webhook (Sprint 8)

docs/
  skills/yalidine-integration/   shipped Guepex integration for AI agents
```

## Trust boundaries

| Client          | Key                       | RLS      | Used by                 |
| --------------- | ------------------------- | -------- | ----------------------- |
| `getSupabase()` | publishable / anon        | Enforced | Every browser code path |
| Edge Function   | service role, server-side | Bypassed | Guepex webhook only     |

There is no service-role key in the application bundle. `GUEPEX_API_TOKEN` is server-side
only and is never prefixed with `VITE_`.

## Authorization model

Authorization is entirely Row Level Security. There is no application-level permission
layer, by design: a forgotten `WHERE` clause cannot leak a row if the policy says no.

- **Public (anon):** read published products and approved reviews, submit an order,
  submit a review.
- **Admin (authenticated, listed in `admin_users`):** everything else.

Every table needs both a policy **and** a base `GRANT`. PostgREST evaluates grants before
policies and returns `401 Unauthorized` if the role lacks the table privilege, which
looks exactly like a broken policy and is not.

## Money

The platform never holds a shop owner's money. Guepex collects cash from the buyer and
remits to the shop owner. Optional card payments, if a shop enables them, run against
that shop's own payment provider account.

This is a hard architectural constraint, not a missing feature. See `docs/PROJECT.md`.

## Delivery

Guepex (formerly Yalidine) behind a carrier interface, so a second carrier is an
implementation rather than a refactor. The webhook is a Supabase Edge Function that
validates the CRC challenge and verifies the HMAC-SHA256 signature over the raw request
body before trusting any payload. Details and the shipped skill:
`docs/skills/yalidine-integration/`.

## Error handling

- SSR throws are caught in `src/start.ts` and returned as a branded HTML page rather than
  a blank screen.
- Supabase failures surface as plain-language messages. A stack trace is never shown to a
  shop owner.
- A missing or unreachable database is reported by `SetupCheck` with the exact fix.
