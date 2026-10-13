# Changelog

All notable changes to OpenStore DZ. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Sprint 0 — Foundation

**Added**

- TanStack Start v1 (React 19) + Vite 7 + Nitro Vercel-preset SSR scaffold.
- Tailwind CSS v4 with the Algerian Emerald design tokens in light and dark themes,
  carried over from the Commerce Storefront reference system.
- Arabic typography: Fraunces, Outfit and IBM Plex Mono self-hosted via Fontsource, with
  Cairo added as the Arabic fallback because the reference fonts have no Arabic glyphs.
  Arabic density override (17px / 1.75) because Arabic needs more air at the same size.
- Theme handling via a `data-theme` attribute with a pre-paint bootstrap script, so an
  explicit user choice wins over the OS setting.
- Single quality gate `npm run check`: typecheck, ESLint, Vitest, knip, production build.
- Local ESLint plugin enforcing the 250-line file and 120-line function limits, with its
  own unit tests. No maintained npm package exists for ESLint 9 flat config.
- Setup health check that explains a missing or unreachable database in plain language
  instead of failing silently.
- `.gitattributes` forcing LF end-of-line everywhere, matching the Prettier config.
- `docs/PROJECT.md`, `docs/DECISIONS.md` and `AGENTS.md`.

**Verification**

`npm run check` green: typecheck, 19 Vitest tests, ESLint clean, knip clean, production
build emits `.vercel/output`.

### Sprint 1 — Documentation, governance and the skill library

**Added**

- `README.md`, `README.ar.md` and `README.fr.md`, each carrying a complete one-click agent
  setup prompt.
- `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `SUPPORT.md`.
- GitHub Actions: quality gate, Trivy image scan, gitleaks history scan via Docker, CodeQL,
  Dependabot, issue and PR templates.
- `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/FEATURES.md`,
  `docs/PROJECT_STRUCTURE.md`, `docs/DEPLOY.md`, `docs/LATER.md`.
- The Guepex delivery skill shipped at `docs/skills/yalidine-integration`, so the setup
  prompt and the delivery integration arrive together.
- `docs/` excluded from ESLint: the skill is vendored MIT code by another author, and
  reformatting it would fork it away from upstream.

### Sprint 2 — Database

**Added**

- `supabase/schema.sql`, the whole database in one idempotent file: 9 tables, 3 enums,
  13 indexes, 9 functions, 8 triggers, 16 policies, 4 storage policies, one public
  `product-media` bucket, and a demo shop that renders on first load.
- `supabase/config.toml` and `supabase/verify.sql`, which asserts 17 properties including
  five statements that are expected to fail.
- Generated `src/lib/supabase/types.ts` from the live schema.

**Design decisions**

- Order placement is an RPC, not three client inserts. `anon` holds no table privileges on
  `orders` or `order_items`; `place_order` writes both in one transaction and `track_order`
  is the only way an anonymous visitor reads one back. The first draft used INSERT policies
  guarded by an order-id `EXISTS` check, which any caller who guessed an id could satisfy.
- Prices are never read from the caller. A BEFORE trigger reads `unit_price`, the variant
  label and the product name from the catalogue; a second function sums the lines onto the
  parent order. `order_items` copies names and prices rather than joining, so a later price
  change does not rewrite order history.
- `authenticated` gets column-level UPDATE on `orders` that excludes `subtotal`,
  `delivery_fee` and `total`. A table-level grant followed by a column `revoke` is a silent
  no-op, so the table-level grant is never issued.

**Fixed**

- `create order_items_order_idx` was missing the word `index`.
- `coalesce(new.order_id, old.order_id)` in a DECLARE default raised `record "old" is not
assigned yet` on the first INSERT. Compiles cleanly; fails at runtime.
- `coalesce(new, old)` on composite records raised `could not identify a record type`.
- The seed's demo reviews arrived unapproved, because `validate_review` forces
  `is_approved := false` on every INSERT. The seed now approves them by UPDATE, the same
  path the moderation screen uses.
- Revoked `EXECUTE` from `anon` and `authenticated` on the five trigger functions that were
  reachable over RPC by accident. Verified afterwards that the triggers still fire.
- Added covering indexes for `order_items.variant_id` and `pack_items.variant_id`, which
  Supabase's performance advisor flagged.

**Verification**

Applied to the live project through MCP and exercised end to end. `place_order` priced
7500 + 600 = 8100 and 9000 + 600 = 9600 from the catalogue; `track_order` returned the
order for a valid token and `null` otherwise; a bad order and an inactive variant were both
rejected, the latter without leaving an orphan row. `anon` holds zero grants on `orders`;
`authenticated` cannot UPDATE the money columns. Both advisor classes were run and every
real finding fixed. `typecheck`, `lint` and `test` exit 0.

**Known**

- `knip` exits 1 with `RangeError: Array buffer allocation failed` under memory pressure. It
  fails identically on an untouched earlier commit, so it is environmental.

## Session report

Completed:

- Phase A of docs/ROADMAP.md. Stock integrity (atomic decrement, oversell guard,
  restock on refusal, no double-restock), image upload from a phone with
  client-side resize to WebP, admin first-run claim flow, enforcement of
  accepts_cod and delivery_wilayas, Algerian phone validation.
- Fixed a latent carrier bug: the wilaya was stored in the buyer's reading
  script, so an Arabic-locale order carried a name Guepex would never match.
- Reconciled supabase/schema.sql with the live database. Seven objects existed
  only in the database, so a fresh one-file install would have produced a weaker
  database than production.
- Adopted the master files: RULES.md copied to docs/, the two personal files
  gitignored.

Verified (what was actually run):

- Stock: 8 to 5 on an order of 3; an order of 10 rejected with the variant named;
  rejected attempt left no orphan row and did not move stock; refusal restored 8;
  a repeat save did not restock twice.
- claim_store() refuses an unauthenticated caller with 42501.
- Phone: 0555123456, +213555123456 and spaced forms pass; 12345678 and a bad
  prefix are rejected.
- Gate green: typecheck, lint, knip, 20 unit tests, 20 e2e tests on desktop and
  mobile, build. npm audit reports 0.
- Not verified: schema.sql has not been re-applied end to end as a whole file,
  only its parts individually. Parcel creation is untested against the real
  Guepex API, whose credentials belong to the owner.

Known issues:

- Performance is unmeasured. No number from vite dev means anything.
- Nothing is deployed.
- Demo imagery is external placeholder URLs.

Next:

- Phase B: stopdesk pickup, commune picker, WhatsApp order, sale prices, fee
  preview. Then Phase C storefront depth (search, categories, filtering).
