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

### B3. WhatsApp order ✔ DONE

WhatsApp is how a large share of Algerian commerce actually happens. A buyer who
is unsure will not fill a form; they will send a message. A prefilled
`wa.me` link carrying the product and the cart turns that hesitation into an
order, and costs nothing to maintain.

Shipped on the product page, carrying the product, variant, quantity and page URL.
Fixing it surfaced a real bug: the stored number was being passed to `wa.me`
unmodified, so an owner typing the local form `0555123456` produced a link that
resolved to nobody. Numbers are now normalised, with unit tests for the four forms
an owner or a seed actually produces.

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

### C1. Search ✔ DONE (Sprint B1)

With more than a page of products, browsing stops working. Name, category and
SKU, Arabic and French, tolerant of the spelling variation Arabic names have.

Shipped as `/search?q=` with the query in the URL, plus Arabic normalisation
(alef, yeh, teh-marbuta, diacritics) so a query typed without hamza still
matches.

### C2. Category pages ✔ DONE (Sprint B1)

The home category strip used to link to `#catalogue`, which scrolls rather than
filters. A shop with 40 products needs real `/category/$slug` pages, and they
are free SEO surface.

Shipped as a server-rendered route that 404s on an unknown slug. Categories
became entities (`categories` table, `products.category_id`) rather than a text
column, which the filter toolbar needed.

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

### D1. Analytics ✔ DONE (Phase D0)

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

### D4. Low-stock view ✔ DONE (Phase D0)

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
dev` means anything. Budgets: 1.5 MB initial payload, LCP under 2.5s on a
  throttled profile (700 kbps, 300 ms RTT, 4x CPU), which is the realistic
  profile for the target market rather than a fibre connection.

  **Measured 2026-10-14, on the built output.** Payload **372 KB** across 29
  files: budget met, with room. LCP **4.4s and 8.9s** on two runs: budget missed,
  and variable. `e2e/performance.spec.ts` asserts both. The LCP assertion is marked
  expected-to-fail rather than deleted, so the number cannot regress quietly and
  the marker self-cleans when someone fixes it.

  What is actually costing the time, from the same run:

  - A single **188 KB compressed** entry chunk (`index-*.js`, 737 KB
    uncompressed) is the largest resource by a wide margin. Worth checking whether
    admin-only code is leaking into the shared chunk.
  - **130 KB of fonts**: Fraunces 67 KB, Outfit 32 KB, Cairo 31 KB. Fraunces is a
    variable font carrying an optical-size axis that a shop with two display sizes
    does not need. Subsetting it is the single cheapest win here.

  Neither is attempted yet. Both are real work with a real chance of breaking
  typography, and guessing at them without measuring the fix would be worse than
  the honest number.

- **E2b. Paginate the storefront catalogue, which means moving filtering server-side.**

  The admin lists are paged. The storefront catalogue is not, and it is a
  different size of job for one reason: `src/lib/catalogue.ts` filters, sorts and
  searches **in the browser** over the whole catalogue, and computes the filter
  facets (sizes, colours, price range) from it too.

  That design was deliberate and documented as the swap point. It stops working the
  moment the list is paged, and it fails in the worst way: filtering a paged list in
  the browser only ever sees the loaded page, so "12 results" becomes a wrong
  answer rather than a slow one.

  So this is not "add a limit". It is:

  1. A `catalogue_page()` RPC taking category, query, sizes, colours, price range,
     in-stock, sort, limit and offset, returning the rows and the total.
  2. `normalize_arabic()` in SQL, matching `normalizeArabic` in the client exactly,
     or the same search stops finding the same things. Hamza forms, both ya forms,
     taa marbuta and diacritics.
  3. Facets from the server too, for the same reason as the rows.
  4. The toolbar and the view switched to a paged query with "load more".
  5. Tests asserting that a filtered page reports the filtered total, because that
     is the assertion that catches the failure above.

  Worth doing before the catalogue passes a few hundred products, which is exactly
  when the current design is documented to stop being viable.

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

---

## Phase D0 - Dashboard overhaul ✔ DONE

The dashboard is three numbers, four filter tabs and a list. It works and it is
not good, and it is the screen the owner looks at every day, so it matters more
than any storefront page.

In the order an owner actually uses it:

1. **Revenue over time.** Orders and confirmed value per day and week, so this
   week can be compared to last. A number with no trend is not information.
2. **Refusal rate by wilaya.** The most valuable number in Algerian COD
   commerce. A wilaya at 40% refusal loses money on every parcel, and nothing in
   the app surfaces it today. It tells the owner which wilayas to drop or to
   require a deposit for.
3. **Top products.** What sells, and what sits.
4. **The call queue as the primary object, not a tab.** Confirming orders is the
   daily job. It should be the first thing on the screen, with a count, and
   workable without opening anything.
5. **Low stock alerts.** Stock is enforced now, but nothing warns before a
   variant runs out.
6. **Bulk actions.** Confirm or ship many at once. Twenty at a time is the real
   daily cost of a busy shop.

Design note: this is a working tool, not a marketing page. Dense, fast, keyboard
friendly, readable at a glance. The storefront's airy spacing is wrong here.
