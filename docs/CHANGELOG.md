# Changelog

All notable changes to OpenStore DZ. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### 2026-10-23 — a first English visit reads left to right; a real demo catalogue

**Added:** `supabase/demo-catalogue.sql`, an optional, idempotent demo shop of 20
different products with 4 colours each, sizes, size guides and approved reviews, and
its 80 photos in `public/demo/` (WebP, 3.4 MB in all). Rerunning it adds only what is
missing and never overwrites an edit.

**Fixed:** a visitor whose browser asked for English got the English page laid out
right to left on the first visit. The inline locale script forced Arabic whenever
`localStorage` was empty, overriding the `lang` and `dir` the server had set from
`Accept-Language`. It now reads the server's cookie first and leaves `<html>` alone
when there is nothing to override. Covered by three regression tests.

### 2026-10-22 (later) — labels, moderation at scale, every language

**Added:** shipping labels modelled on the carriers' own, as one 100 x 150 mm page per
label for thermal printers or four per A4 sheet; Latin versions of the shop's tagline,
description and address, and of the size guide note; size-guide column names
translated for French and English readers.

**Fixed:** review moderation read the newest 200 reviews and filtered in the browser,
so older ones silently disappeared; it now pages in the database with real counts. The
storefront footer no longer links to the admin sign-in. Labels printed one blank page
at the end of a roll. A build cache (`.tanstack/`) was committed by mistake. CodeQL
moves to v4 ahead of v3's deprecation.

**Verified:** labels rendered to PDF at exactly 100 x 150 mm (5 labels, 5 pages) and
A4 (2 sheets); an English scan of the storefront shows no Arabic outside customer
reviews; `npm run check` green, 83 unit tests.

### 2026-10-22 — from launchable to usable by a real shop

**Added:** demo mode for the reference shop; sale prices; fake-order protection
(three pending orders per phone a day, phone blocklist, refusal history in the
queue); packing slips and CSV export; commune suggestions (1,541, MIT dataset);
stopdesk pickup end to end; logo, brand colour and photos by colour; related
products and photo zoom; server-rendered language from a cookie; a Vercel deploy
button.

**Fixed:** deleting a photo from one size deleted the file every other size of
that colour shared; data fetched for the server render was fetched again by the
browser; each product card fetched its own reviews; the home page shipped 510 KB
of HTML because the catalogue returned every variant's every photo; a first visit
in French or English re-rendered the whole page after load.

**Verified** on a fresh local database through the UI and with SQL against
`place_order`; read-only checks and the performance test against production.

**Not verified:** the Guepex office list (no carrier key); production has the
schema changes only once the 2026-10-22 update is applied.

### V1 owner tools — 2026-10-21

**Added:** setup wizard (`/admin/welcome`) with a dashboard checklist, categories
screen (`/admin/categories`), colour × size variant generator.

**Fixed:** a new owner landed on "Admin sign in" right after claiming the shop,
because the admin role was looked up before the claim and never refreshed.
`refreshRole()` now reads the live session and both claim paths call it.

**Verified** against a fresh local database: claimed the shop through `/setup`,
walked the wizard (invalid phone rejected, 58 zones written at 650 / 1300, the
checklist then listed only legal details), created and reordered a category,
generated 9 variants and confirmed a second run skips existing ones. Admin layout
tests including both new screens: 13 passed. `npm run check` green, 68 unit tests.

### Launch audit — 2026-10-21

**Fixed**

- A fresh install from `supabase/schema.sql` failed. Production had a `categories`
  table, `products.category_id`, `free_shipping_threshold` and `admin_analytics()`
  that the file never created. All are now defined.
- `size_guides` and `delivery_zones` had no RLS, policies or grants in the file, so
  a fresh shop could not read its own size guides. Fixed.
- The seeded delivery list used Arabic wilaya names while checkout matches Latin
  ones, which left a fresh shop with an empty wilaya picker. Now empty, meaning
  every wilaya.
- Orders were charged the flat delivery fee while checkout showed the zone fee,
  and the free-delivery threshold was never applied. `delivery_fee_for()` now
  sets the fee and `src/lib/delivery.ts` mirrors it. Confirmed live in production
  before the fix: 26 zones from 600 to 1600 DZD, every order recorded 600.
- `supabase db reset` cannot apply the schema (its seed loader pipelines the
  file). Install docs now apply it with `psql` or the SQL editor.
- CI: Trivy pinned to v0.36.0 by commit; the e2e job is manual because it places
  real orders.

**Verified**

- `schema.sql` applied twice to an empty local database, no errors; generated
  types match production's.
- Fee rules through `place_order`: zone 1600, flat 600, free above threshold.
- Playwright against that fresh database with a freshly claimed owner: 51 passed,
  1 skipped (pagination needs more than one page of products).
- `npm run check` green.

**Not verified**

- The fee fix is not applied to production yet.
- `admin_analytics()` was rebuilt from the dashboard's type; production keeps its
  own version until the schema is reapplied there.

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

## Session report - language dropdown, and the theme toggle question

Completed:

- The language switcher is a native select (a real dropdown) instead of three
  segmented buttons, with a compact variant for header rows.
- Playwright timeout and worker count now scale for the built-preview case. Some
  routes take over 40s against the old 45s ceiling, which was surfacing as
  intermittent failures that looked like page bugs.

Verified (what was actually run):

- npm run check green.
- Responsive suite against the built output, 1 worker: 10 passed.

Known issues:

- The theme toggle was never missing; it renders in both the storefront header and
  the admin aside. In the admin it sits below the fold inside an overflow-y-auto
  column. That is a shell layout bug and is being fixed with the sidebar, not
  patched separately. Recorded so it is not "fixed" twice.
- The reported "not responsive" cart drawer and admin sidebar are still outstanding.

Next:

- The admin shell: port the collapsible sidebar from design system 02.

## Session report - the admin shell

Completed:

- Admin shell rebuilt on the design system's sidebar: collapsible fixed rail from
  1024px, overlay drawer with backdrop below it, one component for both.
- Ported with logical properties. The reference is LTR-only, so a literal copy
  would have put the rail on the wrong edge and slid the drawer the wrong way.
- Collapse preference persisted; drawer closes on backdrop click and Escape.
- Fixed a nav label that said "Orders" for a page headed "Overview".
- Explained the theme-toggle report: it was never missing, only below the fold
  inside an overflow-y-auto column. The shell footer is pinned now.

Verified (what was actually run):

- npm run check green.
- Full Playwright suite against the built output: 39 passed.
- Three new shell tests assert geometry, not classes: drawer open/close on a phone,
  collapse narrows the rail and the page margin follows, and the rail's right edge
  lands on the viewport's right edge in Arabic.

Known issues:

- The cart drawer and the size guide are still outstanding, as are the additional
  shop settings and the Google Sheets integration.
- Nothing is deployed and performance is still unmeasured, so the shell has not
  been seen on a real phone by a real person.

Next:

- The storefront cart drawer, which has the same "not responsive" report as the
  sidebar had.

## Session report - the order queue no longer hides orders

Completed:

- The dashboard showed the call queue and hid the rest, so confirming an order made
  it disappear. All orders are now listed, queue sorted first, and the toggle is a
  filter rather than a swap.
- Ordering extracted to `sortOrdersForQueue` with six unit tests, including the one
  that pins the actual bug: a confirmed order is still in the list.

Verified (what was actually run):

- npm run check green, unit tests included.
- Responsive and admin-shell suites against the built output: 13 passed.

Known issues:

- Still outstanding from the request: the storefront cart drawer, the size guide
  redesign, the additional shop and delivery settings, and the Google Sheets
  integration. The Guepex API sync is deprioritised by the owner, who has no key.

Next:

- The storefront cart drawer.

## Session report - the cart drawer, measured

Completed:

- Six tests that open the cart and assert its geometry. Nothing had ever verified
  the drawer: the responsive audit never opens it, and a dialog is in the top layer
  where a document-level overflow check cannot see it.
- Full width on a phone, side sheet from 640px. At 94vw on a 320px screen it left a
  19px strip of backdrop that reads as misalignment, not as a tap target.
- A stable hook on the header cart button.

Verified (what was actually run):

- npm run check green.
- Cart suite against the built output: 6 passed. Responsive run: 15 passed.
- The drawer fits at 320, 360, 414, 768, does not scroll sideways, and its actions
  stay in view.

Known issues:

- The drawer was reported as not responsive and measures as responsive. The owner
  may be describing something these tests cannot see, which is taste: spacing,
  density, or expecting a bottom sheet on a phone. Needs a screenshot to act on.
- Still outstanding: the size guide redesign, the additional shop and delivery
  settings, and the Google Sheets integration.

Next:

- The size guide, which the owner described as confusing, so the fix is copy and
  structure rather than layout.

## Session report - the size guide, rebuilt

Completed:

- Size guide editor rebuilt as an editable grid. The owner no longer types a
  tab-separated table into a blank box.
- Clothing template, real empty state, add/remove row and column, all copy
  translated into three languages.
- The editor now asks for the table, the unit and the measurement method. The
  research was decisive that a bare table of numbers does not reduce returns;
  NN/G's most-observed failure is a chart that never explains how a length was
  measured.
- Spreadsheet paste preserved: a tab or newline paste replaces the whole table.
- Grid operations extracted to `src/lib/size-guide-grid.ts` with 14 unit tests,
  covering removing the last column and pasting a ragged copy.
- Corrected DECISIONS.md entry 7, which documented an "Algerian Emerald" palette
  that never existed in the code.

Verified (what was actually run):

- npm run check green, unit tests included.
- Responsive and shell suites against the built output: 19 passed.

Known issues:

- The storefront rendering of the guide was not changed, only the editor. It has
  always rendered headers and rows correctly.
- Still outstanding: the extra shop and delivery settings, and the Google Sheets
  export.

Next:

- The remaining shop and delivery settings.

## Session report - order export to Google Sheets

Completed:

- Destinations table (owner-only), export log, and a trigger that queues a signed
  async POST per enabled destination on order creation and on every status change.
- The receiver is a Google Apps Script the owner deploys against their own sheet. No
  OAuth client, no Cloud project, no service key.
- HMAC-SHA256 over the raw body. Sent as a query parameter and as a header.
- Admin UI in Settings: add, name, enable, disable, read and copy the secret, remove,
  and see recent attempts.
- docs/GOOGLE_SHEETS.md: full setup guide, the complete receiving script, and a
  troubleshooting list. DECISIONS.md entry 12.

Verified (what was actually run):

- End to end against a real public endpoint: HTTP 200, correct payload, and the
  signature recomputed over the received body matching both the query parameter and
  the header.
- The trigger exports on a status change and correctly does not export on an
  unrelated update.
- anon holds no privileges on either new table; authenticated holds exactly the four
  DML privileges.
- npm run check green. Full Playwright suite 46 passed.

Known issues:

- Delivery outcome is not surfaced beyond a "queued" log row, because pg_net is
  asynchronous and the app cannot see the response. The raw outcome is in
  net._http_response for six hours. Logged in LATER.md with a trigger.
- The live database now has the new tables and trigger; schema.sql matches.

Next:

- The remaining shop and delivery settings.

## Session report - more shop settings

Completed:

- Announcement bar with its own switch, rendered above the header on every page.
- Instagram, Facebook and TikTok links in the footer, stored as full URLs.
- Returns policy text, the one legally-relevant footer field that was missing.
- Split settings-cards.tsx and site-footer.tsx past the 250-line limit, both by
  audience rather than by size.
- Declined to add a minimum order value: displaying one without enforcing it would
  be a field that lies. Logged in LATER.md with the reason.

Verified (what was actually run):

- npm run check green.
- Full Playwright suite against the built output: 45 passed, 1 skipped.

Known issues:

- `src/lib/queries.ts` is now at the 250-line ceiling and is a domain grab-bag
  (catalogue, categories, reviews, settings). It needs splitting by domain rather
  than trimmed again the next time something is added.
- Still outstanding: performance measurement against the built output, and the
  Guepex API sync, which the owner cannot test without a key.

Next:

- Performance measurement, which is the last unmeasured claim in the project.

## Session report - performance, measured at last

Completed:

- e2e/performance.spec.ts: payload and LCP against the built output, with the
  connection throttled to 700 kbps, 300 ms RTT and 4x CPU.
- Fixed a bug in my own measurement that reported a 0 KB payload, because
  initiatorType is "link" for a stylesheet rather than "stylesheet".
- The LCP budget is asserted and marked expected-to-fail rather than deleted, so it
  cannot regress quietly and self-cleans when fixed.

Verified (what was actually run):

- Payload 372 KB across 29 files. Budget 1.5 MB. Met.
- LCP 4.4s and 8.9s across two runs. Budget 2.5s. MISSED.
- npm run check green.

Known issues:

- LCP on a throttled connection is roughly double the budget. The two dominant
  costs are a 188 KB compressed entry chunk and 130 KB of fonts, of which Fraunces
  is 67 KB and carries an unused optical-size axis. Both recorded in ROADMAP E2
  with the specifics; neither attempted, because guessing at a typography change
  without measuring the result is worse than the honest number.
- Guepex API sync is still not built. The owner has no API key, so it cannot be
  verified even if written, and the skill is in docs/skills/yalidine-integration/.

Next:

- Split the entry chunk and subset Fraunces, then re-measure. That is the work E2
  describes, and it is now measurable rather than theoretical.

## Session report - pagination, part 1: admin orders

Completed:

- The orders list pages instead of silently truncating at 300. A shop with 400
  orders was losing 100 of them from the dashboard with nothing to say so.
- Ordered by (created_at, id). The tiebreaker stops two orders in the same second
  from swapping between pages, which would show one twice and another never.
- The queue is a server-side filter now, not a client-side re-sort of the loaded
  page. The badge comes from a count query that loads no rows, so it cannot drift
  from the truth as the list pages.
- A "loaded / total" indicator, because a paged list and a complete one look
  identical otherwise.
- Deleted sortOrdersForQueue and its six tests: superseded by server-side
  ordering, and a client-side sort over one page would be wrong.
- Split DashboardPage at the 120-line limit, extracting the orders section.
- Page size 20, so the demo's 23 orders exercise paging rather than hiding it.

Verified (what was actually run):

- npm run check green.
- Authenticated suite against the built output: 4 passed, including a new test that
  loads the next page and asserts the count grows without exceeding the total, and
  that the queue filter narrows server-side.

Known issues:

- Still unpaginated: the admin product list (unbounded) and the storefront
  catalogue. The catalogue is the bigger job because paginating it means moving
  filter, sort and search server-side, otherwise filtering only sees the loaded
  page. It is the next piece of work and is recorded in ROADMAP.
- The storefront facets (sizes, colours, price range) are still derived from all
  loaded products, which has the same problem for the same reason.

## Session report - pagination, part 2: admin products

Completed:

- The admin product list pages. It was unbounded, and each row carries its variants
  and each variant its images, so the list pulled the whole catalogue nested on
  every visit.
- The pack-contents picker no longer reuses that query. It has a narrow one, with a
  `PickerVariant` type declaring exactly the four fields it reads.
- A "loaded / total" indicator, same reason as the orders list.

Verified (what was actually run):

- npm run check green.
- Authenticated suite against the built output: 5 passed.

Known issues:

- The storefront catalogue is still unpaginated, and it is the biggest remaining
  piece. Paginating it means moving filter, sort, search and the facets to the
  server: filtering in the browser over a paged list would only ever see the loaded
  page, which is a wrong answer rather than a slow one. Planned in ROADMAP E2b.

## Session report - real pagination in the admin

Completed:

- Replaced "load more" with numbered pages, previous and next, fifteen rows a page.
  Load more is not pagination: the page grows without bound and page 30 needs
  thirty clicks.
- Previous and next are words, not arrows, because an arrow's correct direction
  inverts between Arabic and French.
- The window caps at five numbers with ellipses, and shows all pages when there are
  seven or fewer.
- `pageWindow` extracted and unit-tested, 8 tests. One caught a real bug in my first
  version: it hid pages 3 and 4 of a five-page catalogue.
- The pack picker moved to its own module when admin-products.ts passed 250 lines.
- Fixed the pagination test counting `main ul > li`, which matched the sidebar and
  analytics widgets too.

Verified (what was actually run):

- npm run check green, including the 8 new pagination unit tests.
- Authenticated suite against the built output: 4 passed, including paging to page
  two and asserting the rows stay bounded rather than appending.

Known issues:

- The storefront catalogue still loads every product and filters in the browser. It
  is the remaining piece and the reason is in ROADMAP E2b: paging it means moving
  filter, sort, search and facets to the server first, and half-doing it produces a
  wrong result count rather than a slow one.

## Session report - storefront pagination

Completed:

- Filter, sort, search, facets and paging moved from the browser into the database.
  `normalize_arabic()` and `catalogue_page()` in the schema do it in one call.
- The client-side filter, sort, search and facet code is deleted, not left dormant,
  along with the unbounded product fetch.
- `CatalogueView` owns its own query. A component handed a list can only filter the
  list it was given, which is the bug this replaced.
- `/catalogue` added as a paged all-products page, because the home grid shows one
  page now and neither a category page nor a search page can show the rest.
- Twelve products a page.

Verified (what was actually run):

- The SQL directly: normalisation on diacritics, hamza, taa marbuta and both ya
  forms; paging returning 12/12/9 with no overlap and stable totals; search
  narrowing to 8; sorting ascending and descending; facets present.
- npm run check green. Full suite 50 passed.
- Three new catalogue tests, including page two is not page one.

Known issues:

- The demo catalogue has inconsistent data the facets now surface: size `S` and `s`
  exist separately, and one colour is `red` while the rest are Arabic. Pre-existing
  seed drift, visible for the first time because the facets come from the server.
- The search box fires a request per keystroke. It wants a debounce, which the
  previous in-memory filtering did not need.

## Session report - deployment

Completed:

- Set the four Supabase environment variables on the Vercel project, for production
  and preview.
- Deployed the site. Live at https://openstore-dz.vercel.app, aliased, publicly
  reachable with no login wall.
- Removed 10 accumulated `E2E-TEST` orders from the demo database, a third of the
  order queue, and documented the cleanup.

Verified (what was actually run):

- The full suite against the live production URL: 51 passed, 0 failed, 0 skipped.
  This includes the admin dashboard test, which needs credentials and had been
  skipped in every local run.
- The production URL returns 200 to an anonymous request and serves real storefront
  HTML.

Known issues:

- Pushes to the repository do NOT deploy. Vercel blocks them with
  `BLOCKED` / `troubleshoot-project-collaboration#account-configuration`, because
  the commits are authored with an email no GitHub account owns, and Vercel cannot match
  that to the account that owns the project. The build never starts, so this is not
  a code problem. Deploying works from the CLI, and from a directory without `.git`.
  Fixes: verify that email on the Vercel account, make the repository public, or
  keep deploying from the CLI.
- The suite leaves an order behind on every run. Documented, not automated, because
  the browser cannot delete orders under RLS.
- The store name in the database is still the template default.
