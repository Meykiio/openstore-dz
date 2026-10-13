# Roadmap

What is left, in priority order, with the reason each item matters. Phases are
deliberately ordered: each one removes a reason a real shop cannot use the
platform, before adding anything nice to have.

Last updated after Phase A completed.

---

## Phase A — Make it work end to end ✔ DONE

These were not features. They were reasons a real shop could not run.

|     | Item                      | Why it mattered                                                                                                                                                                                                                                                                                                             |
| --- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | Stock integrity           | Stock was never decremented and never checked, so the catalogue kept selling goods that were gone. Now a conditional `UPDATE ... WHERE stock >= n` inside the order-item trigger: atomic, so two simultaneous orders for the last item cannot both succeed. Refusal/cancel/return restocks, guarded against double-restock. |
| A2  | Image upload              | `variant_images` took only a pasted URL. An owner photographing stock on a phone cannot produce one. Now a camera button (`capture=environment`), with photos decoded, scaled to 1600px and re-encoded to WebP in the browser first — 4 MB becomes ~200 KB, which matters on Algerian mobile data at both ends.             |
| A3  | Admin bootstrap           | There was no way to become an administrator at all; `admin_users` has no INSERT policy and the only route in was hand-editing SQL. Now `claim_store()` lets the first authenticated user claim the store, serialised with an advisory lock, and shuts permanently afterwards.                                               |
| A4  | Enforce selling rules     | `accepts_cod` and `delivery_wilayas` were stored and displayed but never enforced. A crafted request could order to an unserved wilaya. Also fixed a latent carrier bug: the wilaya was stored in the buyer's reading script, so an Arabic-locale order carried a name Guepex would not match. French canonical now.        |
| A5  | Algerian phone validation | The old rule accepted `12345678`. On cash on delivery the phone number is the only way to confirm an order, so a bad one is a parcel that ships and comes back.                                                                                                                                                             |

---

## Phase B — Algeria-specific

### B1. Stopdesk (pickup point) — highest remaining item

Guepex charges less for delivery to a stopdesk than to a home, and in Algeria
many buyers prefer it: no waiting at home, no missed courier, lower fee. Not
offering it means either overcharging buyers or absorbing the difference.

- Add `delivery_method` to orders (`home` | `stopdesk`).
- Sync Guepex centres per wilaya into a `pickup_points` table (server function,
  cached), so the buyer picks a real one by name.
- Two fees per zone: home and stopdesk.
- Pass `is_stopdesk: true` and the centre id when creating the parcel.

### B2. Commune picker instead of free text

`orders.commune` is free text today, and `to_commune_name` goes straight to the
carrier, which matches on an exact string. A typo is a rejected parcel. Guepex
exposes `/communes` per wilaya; fetch and cache, and let the buyer pick.

### B3. WhatsApp order

WhatsApp is how a large share of Algerian commerce actually happens. A buyer who
is unsure will not fill a form; they will send a message. A prefilled
`wa.me` link carrying the product and the cart turns that hesitation into an
order, and costs nothing to maintain.

### B4. Sale prices

`product_variants.compare_at_price` exists and the design system already has
`.pc-price-old` and `.pc-flag.sale` styling. Missing: an admin input, and the
storefront rendering the strike-through and the saving.

### B5. Fee preview on the product page

A buyer choosing between two products wants to know the delivered cost before
committing. Showing `price + delivery to your wilaya` once a wilaya is known
removes the main reason a COD cart is abandoned at the last step.

---

## Phase C — Buyer experience

### C1. Search

With more than a page of products, browsing stops working. Name, category and
SKU, Arabic and French, tolerant of the spelling variation Arabic names have.

### C2. Category pages

The home category strip currently links to `#catalogue`, which scrolls rather
than filters. A shop with 40 products needs real `/category/$slug` pages, and
they are free SEO surface.

### C3. Cart page

The cart is a drawer only. On desktop a shareable `/cart` URL is expected, and
the drawer is a dead end if a buyer opens an item in a new tab.

### C4. Related products

Small, and it lifts average order value on exactly the traffic a COD shop gets.

### C5. Buyer order history

A buyer's only handle on an order is the token link. Storing recent tokens in
`localStorage` gives them a "my orders" list without requiring an account —
which matters, because requiring registration would cost more orders than it
gains.

### C6. Back-in-stock notification

Out-of-stock pages currently just say so. Collecting a phone number for a
one-time WhatsApp or SMS when it returns turns dead traffic into orders.

---

## Phase D — Owner experience

### D1. Analytics

The dashboard shows today's counts. An owner needs revenue over time, best
sellers, and above all the **refusal rate by wilaya** — that number tells them
which wilayas to stop serving, and nothing else in the app surfaces it.

### D2. Printable packing slip

An owner handing parcels to a courier needs a slip per order. Currently they
would copy details by hand. This is the difference between using the app and
using a notebook.

### D3. CSV export

Owners reconcile in Excel. Without an export they retype orders, and an app that
creates retyping loses.

### D4. Low-stock view

Stock is enforced now, but nothing warns before a variant runs out. A list
sorted by remaining stock, and a badge on the dashboard.

### D5. Order status timeline

`confirmed_at`, `refused_at`, `shipped_at` and `delivered_at` exist but are only
shown as a current status. A timeline answers "when did this go wrong".

### D6. Bulk actions

Confirming or shipping twenty orders one at a time is the main daily cost for a
busy shop.

---

## Phase E — Launch

- **E1.** `sitemap.xml`, `robots.txt` per store, and `Product`/`Offer` JSON-LD so
  products can appear in search results with a price.
- **E2.** Performance pass against the **built** output. No number from `vite
dev` means anything. Budgets already asserted informally: 1.5 MB initial
  payload, LCP under 2.5s on a throttled 3G profile — which is the realistic
  profile for the target market, not a fibre connection.
- **E3.** Deploy to Vercel, set `GUEPEX_WEBHOOK_SECRET`, replace the placeholder
  demo imagery, and connect error monitoring.

---

## Known gaps that are not features

- **Nothing is deployed.** Everything is verified locally against the live
  database only.
- **Performance is unmeasured.** Not "slow" — unmeasured.
- **Guepex parcel creation is untested against the real carrier**, because the
  API credentials are the owner's and no agent can generate them.
- **The demo imagery is external placeholder URLs** and must be replaced before
  the shop is public.
