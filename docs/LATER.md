# LATER

Ideas found while building, deliberately not built. Each needs a reason and a trigger,
not just a note. When something is done here, move it to a sprint and delete the entry.

Nothing may be promoted from this file into the current sprint without an explicit
request.

---

## Ideas with a clear trigger

**Vite 8 with TanStack Start 1.169, and Lucide 1.x.**
Trigger: a fix or feature needs either. `@tanstack/react-start` 1.169 requires Vite 8, and
`lucide-react` 1.x renames or removes icons. Dependabot skips both
(`.github/dependabot.yml`) until they are done as their own change, with the full check
and the browser tests.

**A captcha on the order forms (Cloudflare Turnstile).**
Trigger: fake orders get past the database limits (many phones from many IPs). It needs
a server check of the token before `place_order`, so orders would go through a server
function instead of straight to Supabase.

**Two-step sign-in (TOTP) for the admin.**
Trigger: shops add staff accounts, or an owner's password leaks. Supabase Auth supports
it; the policies would require `aal2`.

**Dependabot in owners' copies.**
Trigger: owners ask about pull requests they did not open. A shop made with the Vercel
button copies `.github/dependabot.yml`, so Dependabot opens dependency pull requests in
the owner's repository and Vercel builds them (one failed on the 2026-10-30 test copy).
The `Update OpenStore` workflow already brings checked dependencies; the copies could
skip Dependabot, for example by moving the config out of `.github/` at install.

**The eleven 2026 wilayas at Guepex.**
Trigger: Guepex's `/wilayas` lists Aflou, Barika and the rest. Drop `carrierWilaya`.

**Add ZR Express as a second carrier.**
Trigger: a shop owner asks for it, or Yalidine's coverage is refused in a wilaya the shop
actually sells to. Not before. One carrier done properly beats two done partially, and
Guepex remits COD while ZR Express advertises 0% commission, which is a real trade-off a
shop owner should choose, not us.

**Per-shop Chargily card payments.**
Trigger: a shop owner has signed up with Chargily and asks to connect. Only then, and only
for that shop, using their own credentials. Never a platform-wide payment feature. See
`docs/DECISIONS.md` entry 5.

**Tamazight and Darija interface languages.**
Trigger: a contributor who is a native speaker offers them. Machine translation into
Darija is actively harmful, because Darija has no written standard and is written in
three different scripts depending on the person. Do not attempt it without a native
speaker.

**Localised page titles.**

Every route's `head` title is a hardcoded Arabic string. The locale lives in
`localStorage`, which the server cannot read, so `head` (which runs per request on
the server) has no way to know the visitor's language.
Trigger: when the locale moves to a cookie, or when the first non-Arabic shop owner
complains. Moving it is an architecture change, not a copy fix: it touches how the
locale is bootstrapped, and the bootstrap script exists specifically to avoid a
flash of the wrong language. Not worth doing for a browser tab.

**Per-target export health.**
Order exports are fire-and-forget: the trigger logs `queued` and `pg_net` keeps the
real outcome for six hours in `net._http_response`, which the owner has to query by
hand. A card per destination showing "last success" and "last error" would turn a
silent failure into a visible one.
Trigger: the first time an owner reports orders not arriving and has to be walked
through the SQL. Until then the setup guide covers it, and adding it now would mean
scheduled polling of an unlogged table.

**Abandoned-cart WhatsApp follow-up.**
Trigger: after the confirmation queue ships and there is real order volume. The research
says the phone call is what works, not the message.

---

## Ideas with no trigger yet

**Multi-warehouse stock.**
One shop, one stock pool. Recorded because it is the first thing an ERP-minded shop owner
asks for, and the answer for a long time is no.

**Discount codes.**
Packs can already be priced differently, and a discount code on a cash-on-delivery order
adds a refund surface for no proven demand.

**Customer accounts.**
Buyers do not log in. A customer account on a cash-on-delivery store in Algeria is
friction with no benefit, because the confirmation call is the real customer
relationship. Revisit only if repeat-purchase data shows buyers want to track their own
orders.

**CSV import for bulk products.**
Trigger: a shop migrates with more than 100 products. Before that, a single-product form
is faster.

**Printable packing slip and invoice.**
Trigger: a shop asks. The legal disclosure fields exist from Sprint 2 so this is mostly
rendering work.

---

## Explicitly rejected

**Anything that intermediates the shop owner's money.**
No commission engine, no escrow, no platform wallet, no marketplace payout ledger. No
Algerian payment provider supports split payouts, and a foreign entity cannot obtain a
CIB or Edahabia merchant ID without Algerian registration. This is not a "later", it is
never.

**Multi-shop marketplace, cross-shop discovery, shared catalogue.**
The first framing of this project was a multi-seller marketplace. Jumia exited Algeria in
March 2026 and Batolis sits at a 99% bounce rate. See `docs/DECISIONS.md` entry 1.

**Hosting other people's shops for a fee.**
This is a self-hosted platform. If a hosted tier is ever built, it must be a separate
project with its own name, because the AGPL promise to shop owners is that this code is
free to run, forever, and a paid hosted tier by the same owner is a conflict of interest
with that promise.
