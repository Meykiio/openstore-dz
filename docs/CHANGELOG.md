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

## Session report - Sprint B1, storefront depth

Completed:

- Categories promoted from free text to entities with canonical slugs, linked by
  FK, text column dropped. Existing labels backfilled.
- /category/$slug with SSR, real titles and a meta description.
- /search with the query in the URL.
- Shared filter and sort bar: size, colour, price range, in-stock-only, four
  sort orders. Client-side by design at this scale, documented with the
  threshold where it must move server-side.
- Arabic-tolerant search normalisation (hamza, ya forms, taa marbuta,
  diacritics).
- Fixed: product cards rendered a category link inside the card's own anchor,
  which is invalid HTML.
- Fixed: a duplicate nav.products key broke the locale files. Caught by
  typecheck, not shipped.

Verified (what was actually run):

- typecheck, lint, knip, build all exit 0.
- Live routes: /category/shirts 200, /category/packs 200, unknown category 404,
  /search 200, / 200.
- Not verified: no e2e test covers filtering or search yet, and the filter bar
  has not been used by a person.

Known issues:

- Performance still unmeasured.
- Nothing deployed.
- Demo imagery still placeholder URLs.

Next:

- Phase D0, the dashboard overhaul, which the owner asked for and which is the
  screen they use daily.

## Session report - Phase D0, the dashboard

Completed:

- admin_analytics() aggregate function: revenue per day, status funnel, totals,
  refusal rate by wilaya, top products, low stock. One function, one round trip,
  aggregated in the database rather than in the capped client fetch.
- Dashboard rebuilt: four headline tiles, revenue chart drawn as inline SVG, the
  call queue promoted to the first object on the page, refusal table by wilaya,
  best sellers, low stock, and a wilayas-to-watch warning.
- Locale files split into storefront and admin halves. They passed the 250-line
  [HARD] limit; the seam is the audience, which is the real one. Done with a
  state-machine parser because Prettier wraps long values and a line filter moves
  the continuation into the wrong file, which is exactly what the first attempt
  did.

Verified (what was actually run):

- Aggregation logic verified against known inputs: 6 orders gave confirmed value
  16000, refused 1, and byWilaya returned Alger at 0.25 while correctly
  excluding Oran below the three-order threshold.
- The first attempt at that test was wrong, not the code: a sloppy UPDATE did
  not filter by wilaya and flipped an order the previous statement had already
  marked delivered. Redone deterministically with explicit ids.
- typecheck, lint, knip, unit tests and build all exit 0.
- Routes respond: /admin 200, /setup 200, /category/shirts 200, /search 200.

Known issues:

- The dashboard has NOT been visually verified with real data. It needs an
  authenticated session and I have no credentials; the aggregation behind it is
  verified, the rendering is not.
- Performance still unmeasured. Nothing deployed. Demo imagery still placeholder.

Next:

- Sign in as the owner and look at /admin. Everything is behind a login I cannot
  pass, and the owner's judgement on the layout is the missing input.

## Session report - responsiveness measured, and the docs made true

Completed:

- Responsive audit that measures instead of guessing: page-level horizontal
  overflow at seven widths across every visitor and admin route, a tap-target
  floor, and a check that the mobile bottom bar stays pinned to the viewport. It
  runs against the built output, which is the only place a layout measurement
  means anything. Plus an authenticated pass that signs in and checks the admin
  area fits a phone.
- Tap targets raised: the language switcher (25px), the header brand link (30px)
  and the footer telephone, WhatsApp and email links (17px).
- Docs truth pass. Four documents described a project that no longer exists.
  FEATURES.md named an "Algerian Emerald" palette that was never shipped and
  listed the catalogue, checkout, reviews, Guepex and the PWA as not yet built.
  PROJECT.md contradicted itself two lines apart and exempted a file that did not
  exist. ROADMAP.md still showed search, category pages and analytics as
  outstanding. AGENTS.md pointed at a script that does not exist.
- docs/DESIGN_SYSTEM.html, which PROJECT.md and AGENTS.md both already exempted
  from the file-size rule, now exists and documents the shipped tokens.
- Removed a dead DashboardOrder type and a stale LATER.md entry for search.

Verified (what was actually run):

- Production build, then the responsive suite against it: 10 passed. No
  horizontal overflow at 320, 360, 390, 414, 768, 1024 or 1280 on any route.
- The authenticated audit passes, so the dashboard does render its range switcher
  and analytics grid. That gap was open for two sessions.
- npm run check green: typecheck, lint, unit tests, knip, build.

Known issues:

- The first responsive run failed five times and then passed. I nearly recorded
  that as a layout bug. It was not: in vite dev the stylesheet is injected during
  hydration, so the suite was measuring the loader. Recorded in PROJECT.md and
  AGENTS.md so the next agent does not repeat it.
- The earlier claim in my own notes that SECURITY.md and SUPPORT.md were missing
  was wrong. Both exist; my first listing was truncated at 30 entries.
- The dev-server overflow is still reachable in dev. It is not a production
  defect, but it will look like one to anyone who measures there.

Next:

- Phase B. Stopdesk pickup first.

## Session report - README truth pass

Completed:

- All three READMEs corrected. English claimed the catalogue, checkout and
  dashboard were still being built, two lines above a table marking their sprints
  Done, and claimed no accessibility audit had run. Arabic carried the same
  sentences. French stopped at sprint 8 entirely, with no sprint 9 or 10 row and
  no note about the two human steps, so a French reader got a more optimistic
  picture than an English or Arabic one.
- Sprint 9 (Accessibility gates) is now Done in all three, because it is: axe-core
  runs WCAG 2.1 A and AA on every visitor page on every run, and the responsive
  audit measures layout against the built output. Sprint 10 stays Partial, because
  performance is unmeasured and nothing is deployed.
- docs/DESIGN_SYSTEM.html added, so the exemption already recorded in PROJECT.md
  and AGENTS.md refers to a file that exists.

Verified (what was actually run):

- npm run check green after the edits.
- Grepped all three READMEs for the stale phrasings to confirm none survived.

Known issues:

- Thirty percent of this session went to removing false statements from my own
  documentation rather than to features. That is the cost of letting docs drift
  while claims were made faster than they were checked. The gate cannot catch it;
  only reading the docs against the code can.

Next:

- Phase B. Stopdesk pickup first.

## Session report - Phase B3, WhatsApp ordering, and the layout bug it found

Completed:

- WhatsApp order link on the product page, carrying product, variant, quantity
  and page URL. Stage B3 of the roadmap.
- Fixed a live bug: wa.me was being given the stored number unmodified, so an
  owner typing 0555123456 produced a link that resolved to nobody. Normalised,
  with unit tests and two end-to-end tests.
- Fixed the malformed seed WhatsApp number (+21355500000000, fourteen digits).
- Fixed a real dashboard overflow at 360px: 39px wider than the viewport, caused
  by grid items refusing to shrink. min-w-0 on the widget roots.
- Split product-detail.tsx by responsibility when it passed 250 lines.
- Cleaned knip.json: it pointed at a path that does not exist, and most of it was
  redundant. Hint noise 12 to 1.
- Capped Playwright workers when targeting a built server.
- Fixed an accessibility test that was navigating a slug that no longer exists and
  passing against a 404.

Verified (what was actually run):

- Full Playwright suite against the built output: 36 passed, including the
  responsive audit at seven widths and the authenticated dashboard check.
- npm run check green.
- The dashboard overflow was measured before and after: html.scrollWidth fell
  from 399 to 360 at a 360px viewport.

Known issues:

- The live store_settings.whatsapp row is still the malformed seed value. Only the
  schema was corrected. Changing existing data needs the owner's approval, so it
  is left alone and recorded here.
- The responsive audit needed two corrections before it could be trusted. It was
  excluding every element as clipped because body has overflow-x hidden, which is
  wrong for fixed-position elements, and it filtered out zero-height elements. An
  overflow check that cannot name the offender is not a check.
- No horizontal overflow now, but the audit only covers 360 and 1280 for admin
  routes and seven widths for visitor routes.

Next:

- Passwords on a public repo: the owner's admin password currently equals the
  email address. That must change before any deploy.
- Phase B, next item: stopdesk pickup.

## Session report - repo readiness, and a security pass

Completed:

- Structure checked against the owner's reference repo (Receipto-dz). SECURITY.md,
  SUPPORT.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md, LICENSE, issue templates, PR
  template, dependabot, CodeQL and the three-language READMEs were all already
  present; my first listing was truncated at 30 entries and I wrongly reported
  some as missing.
- docs/DESIGN_SYSTEM.html created, which PROJECT.md and AGENTS.md already exempted
  from the file-size rule. It documents the real tokens read out of styles.css.
- Security pass: owner email not in any tracked file, .env ignored, both master
  files ignored, no keys or tokens committed. Removed the live project ref from
  src/lib/supabase/types.ts and docs/PROJECT.md, because a public template should
  not pin the author's backend.
- The nine-phase roadmap and FEATURES.md now match what actually ships.

Verified (what was actually run):

- npm run check green.
- Full Playwright suite against the built output: 36 passed.
- Grepped tracked files for the email, the project ref, publishable keys and
  service-role tokens.

Known issues:

- NOT BLOCKING A LOCAL BUILD, BLOCKING A DEPLOY: the admin password equals the
  admin email. Anyone who knows the email can sign in. This must change before
  the shop is public.
- The live store_settings.whatsapp row still holds the malformed seed value.
- Nothing is deployed and performance is still unmeasured.

Next:

- Stopdesk pickup (B1), the highest remaining Algeria item.

## Session report - admin i18n gaps, and a copy bug

Completed:

- 24 missing translation keys across three locales; the admin UI no longer has
  Arabic baked into JSX in eleven files.
- Fixed a real copy bug: the order row printed "3 × Quantity". The item count was
  being interpolated into the label for the word Quantity.
- Split admin.settings.tsx past the 250-line limit into page plus form sections.
- Logged the page-title limitation (locale is in localStorage, head runs on the
  server) in LATER.md with a trigger, rather than half-fixing it.

Verified (what was actually run):

- npm run check green.
- Playwright responsive project against the built output: 10 passed, including the
  authenticated check that visits /admin/settings, so the settings split renders.

Known issues:

- Page titles remain hardcoded Arabic. Documented as a limitation with a trigger.
- The size guide editor still has hardcoded strings; it is being redesigned, so
  translating it twice would be waste.

Next:

- The admin shell: port the collapsible sidebar from design system 02.
