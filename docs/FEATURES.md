# FEATURES

**Verified feature set.** Nothing on this page is aspirational. If a feature is not
listed as working here, it does not work yet. The order of remaining work lives in
`docs/ROADMAP.md`; the history of what changed lives in `CHANGELOG.md`.

Last verified against the built output, not the dev server.

## Working now

### Buying

- **Pickup or home delivery.** Both prices shown wherever the owner priced pickup;
  the database charges the one chosen.
- **Commune suggestions** for the chosen wilaya, still accepting any commune typed.
- **Sale prices** with the original struck through.
- **Related products and full-screen photo zoom** on the product page.
- **The buyer's language from the first byte**, carried in a cookie.

- **Catalogue.** Home page with hero, trust bar, category strip, product grid, promo
  band and a review wall.
- **Category pages.** `/category/$slug` is a real server-rendered route, not a scroll
  anchor. An unknown slug returns a 404.
- **Search.** `/search?q=` keeps the query in the URL so a result is shareable and
  back-navigable. Arabic-tolerant: it normalises alef, yeh, teh-marbuta and strips
  diacritics, so a query typed without hamza still matches.
- **Filter and sort.** Size, colour, price band and in-stock, plus four sort orders,
  from a shared toolbar used by both category and search pages.
- **Product pages.** Variant selection (colour and size), gallery, size guide, reviews,
  and a pack showing its contents.
- **Cart.** Drawer-based, with quantity edits and a live item count.
- **WhatsApp order.** A prefilled `wa.me` link on the product page carrying the product,
  the variant, the quantity and the page URL. A buyer who is unsure will not fill in a
  form; they will send a message. The stored number is normalised, so an owner who types
  the number the way it is written in Algeria (`0555123456`) gets a link that resolves
  rather than one that opens WhatsApp and finds nobody.
- **Checkout.** Cash on delivery, with the delivery fee resolved from the wilaya and
  shown before submit. The order is written by a database function, so pricing cannot
  be tampered with from the browser.
- **Order tracking.** By token, plus a shareable `/order/$token` page.

### Selling

- **Fake-order protection.** At most three unconfirmed orders per phone number in
  24 hours, enforced in the database; a blocklist; each order shows the number's
  refusal history.
- **Shipping labels and CSV.** One order or every confirmed order, as 100 x 150 mm
  thermal labels or four per A4 sheet; a CSV of every order that Excel opens with
  Arabic intact.
- **Branding.** Optional logo and brand colour, from the wizard or settings.
- **Photos by colour.** Uploaded once, shown on every size of that colour.

- **Setup wizard.** Straight after claiming the shop: name, phone and WhatsApp
  (validated as Algerian), delivery prices for all 58 wilayas from a north and a
  south price, free-delivery threshold, legal details. Demo values start blank.
  The dashboard keeps a checklist of anything buyers still see as missing or fake.
- **Categories screen.** Create, rename, hide, reorder and delete categories
  without SQL. Deleting one leaves its products in the shop, uncategorised.
- **Variant generator.** Colours × sizes with one price and stock, previewed
  before writing; existing combinations are skipped, so running it twice is safe.
  Swatch colours are guessed from common names in Arabic, French and English.
- **Colour-first product page.** Buyers pick a colour, then a size; the gallery
  follows the colour.

- **First-run claim.** The first authenticated user claims the store, serialised with an
  advisory lock, and the claim route closes permanently afterwards.
- **Dashboard.** Confirmed value, refusal rate, average order and call-queue size over a
  7, 30 or 90 day window; a revenue chart; refusal rate by wilaya; best sellers; low
  stock. The call queue is the first object on the page, because confirming orders is
  the daily job.
- **Refusal rate by wilaya.** The number that decides whether a wilaya is worth serving
  on cash on delivery. Wilayas under three orders are excluded as noise.
- **Products and variants.** Create, edit, feature, publish. Colour and size variants
  with per-variant stock, SKU and images.
- **Photo upload from a phone.** A camera button captures with `capture=environment`,
  decodes, scales to 1600px and re-encodes to WebP in the browser before upload. A 4 MB
  photo becomes roughly 200 KB, which matters on both ends of Algerian mobile data.
- **Packs.** Bundle products into a pack with its own price.
- **Size guide builder.** Per product, in a spreadsheet-style editor. Not decoration:
  fashion returns run 35 to 50 percent without a size guide against 8 to 15 with one.
- **Review moderation.** Buyer reviews arrive unapproved and an owner approves or deletes
  them.
- **Delivery zones.** Per wilaya, with fees, and a switch that refuses orders to wilayas
  the shop does not serve.
- **Guepex parcels.** Create a parcel for an order from the dashboard, with the
  address and declared value read from the database rather than the request.
- **Order export to Google Sheets.** Any number of destinations, off by default. Each
  new order and each status change is signed with HMAC-SHA256 and posted to the
  owner's own Google Apps Script, which writes it into their sheet. Setup guide and
  the receiving script are in `docs/GOOGLE_SHEETS.md`. The request is queued by the
  database after the order commits, so a broken endpoint can never delay or fail a
  checkout.

### Data integrity

- **Stock is atomic.** Decrementing happens in a conditional
  `UPDATE ... WHERE stock >= n` inside the order-item trigger, so two simultaneous orders
  for the last item cannot both succeed. An oversell raises rather than silently going
  negative.
- **Restock on refusal.** A refused, cancelled or returned order returns stock, guarded
  against double-restock by checking the previous status.
- **Selling rules are enforced in the database**, not in the UI. A crafted request cannot
  order to an unserved wilaya or while the shop has cash on delivery switched off.
- **Wilayas are stored in French.** The carrier matches on exact strings, so the
  canonical value is the French name and the display is localised.
- **Algerian phone validation.** `0[5-7]XXXXXXXX`, `0[2-4]XXXXXXXX` and the `+213` forms.
  A plausible-looking but wrong number is a parcel that ships and comes back.

### Languages, theme and platform

- **Arabic, French and English.** Arabic is primary and RTL is the default direction, not
  a mode. Every key exists in all three; a missing one is a compile error, because the
  Arabic dictionary defines the key type.
- **Light theme by default, enforced.** A buyer's phone in dark mode does not turn the
  shop dark before they choose. The choice is remembered and applied before first paint.
- **Installable PWA** with real generated icons and a service worker that caches hashed
  assets and never caches cross-origin.

### Security

- **Server-side authorization.** Admin routes check the role from the database, not from
  client state. Hiding a button is not authorization.
- **Secrets are server-only and verified absent from the client bundle.** The Guepex
  credentials live in a module marked `server-only` and imported dynamically inside the
  handler.
- **Webhooks are signed.** HMAC-SHA256 over the raw body, with `event_id` deduplication
  and the CRC challenge answered.

### Quality

- **One gate:** `npm run check` runs typecheck, lint, unit tests, a dead-code scan and a
  production build, and must pass before every commit.
- **250-line file and 120-line function limits**, enforced by a local ESLint rule with its
  own unit tests rather than by discipline.
- **Accessibility:** axe-core against WCAG 2.1 A and AA on every visitor page, in desktop
  and mobile projects, including the colour-contrast rule.
- **Responsive audit:** no page-level horizontal overflow at 320, 360, 390, 414, 768, 1024
  or 1280 on any visitor or admin route, and a minimum tap-target size, measured against
  the **built** output.
- **Authenticated layout audit:** signs in and checks the dashboard renders real figures
  and the admin pages fit a phone.
- **`npm audit`: 0 vulnerabilities.**

## Planned, not yet built

Listed so the remaining scope is visible, with reasons, in `docs/ROADMAP.md`.

- Stopdesk (pickup-point) delivery, which Guepex charges less for and many Algerian
  buyers prefer
- Commune picker instead of free-text commune
- Sale prices: `compare_at_price` exists and the storefront styling exists, but there is
  no admin input yet
- Delivered-cost preview on the product page
- A shareable `/cart` route (the cart is a drawer only)
- Related products
- Buyer order history from `localStorage`, without requiring an account
- Back-in-stock notification
- Printable packing slip
- CSV export for reconciliation
- Bulk order actions
- Order status timeline
- `sitemap.xml`, per-product `Product`/`Offer` JSON-LD
- A measured performance pass against the built output
- Deployment

## Design system

- **Ported value-for-value** from the Commerce Storefront reference system (system 02), a
  component-CSS system, including the component classes (`.btn`, `.chip`, `.product-card`,
  `.gallery`, `.cart-*`, `.review-card`, `.ds-table`) rather than an approximation rebuilt
  out of utilities.
- **Palette: burnt orange with a berry accent.** Primary `#c2410c`, secondary `#e11d48`,
  tertiary `#b45309`.
- **Two measured deviations from the reference, both for WCAG AA.** The reference primary
  `#d9480f` scores 4.29:1 white-on-orange and 4.02:1 orange-on-cream, under the 4.5:1
  floor for text below 18.66px, so it fails on every button label. `#c2410c` is the same
  hue one step darker and scores 5.18:1 and 4.85:1. Muted text was likewise darkened from
  `#78716c` to `#6b6460`. Both are asserted by `e2e/accessibility.spec.ts`.
- **Arabic typography.** Cairo is added to the font stacks because the reference is
  Latin-only and would otherwise fall back to whatever the operating system has.
- **Arabic density override.** 17px at 1.75 line height against Latin's 15px at 1.5,
  because Arabic has a smaller x-height at the same nominal size.
- **Reduced motion is respected.** Animations collapse under `prefers-reduced-motion`.

## Setup

- **First-run health check.** On load the app verifies it can reach the database and
  reports connected, not configured, or unreachable, with the exact steps to fix it rather
  than a blank page.
- **One-click agent setup.** `README.md` carries a prompt that checks prerequisites,
  installs what is missing, applies the schema, fills `.env` and verifies each step.
  Available in English, Arabic and French.

## Explicitly out of scope

- **Anything that intermediates a shop owner's money.** No commission engine, no escrow,
  no platform wallet. No Algerian provider supports split payouts, and a foreign entity
  cannot get a CIB or Edahabia merchant ID without Algerian registration. See
  `docs/DECISIONS.md` entry 5.
- **Marketplace features.** Cross-shop discovery, shared catalogue. One shop per
  installation. See `docs/DECISIONS.md` entry 1.
- **Hosted SaaS.** Each shop runs its own instance.
