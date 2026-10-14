# DECISIONS

Every significant decision, with its context and consequences. Newest last.
Do not relitigate a recorded decision silently — supersede it with a new entry
that explains what changed.

---

## 1. One store per installation, not a multi-tenant marketplace

**Context.** The first framing was a multi-seller marketplace where many sellers share
one catalogue. The research contradicted it: Jumia exited Algeria in March 2026, Batolis
sits at a 99% bounce rate, and Yassir abandoned pure multi-vendor for owned retail. The
product was reframed as a free self-hosted shop that one business runs.

**Decision.** Single-tenant. No `tenant_id`. Each installation is one shop.

**Consequences.** Row Level Security becomes admin-versus-public instead of
tenant-versus-tenant, which is simpler and already proven. There is no cross-shop
discovery, no commission engine, no payout splitting. In exchange, no shop owner is
competing with a platform-owned shop, and there is no money flow to license.

---

## 2. AGPL-3.0-only

**Context.** The goal is community ownership with no closed commercial fork.

**Alternatives.** MIT and Apache-2.0 give zero protection against a closed fork. GPL-3.0
only triggers on distribution, so a hosted closed fork is legal under it — this is
precisely why it is disqualifying here. BSL and SSPL are not OSI open source and would
break trust with contributors.

**Decision.** AGPL-3.0-only, matching the owner's `djazayer-khadhra` precedent.

**Consequences.** Section 13 requires offering source to anyone who modifies the platform
and serves it over a network. This costs some enterprise-adjacent contributors and no
others: the audience is individual Algerian shop owners self-hosting, for whom the
copyleft promise is an asset.

---

## 3. Server-side rendering, not a static SPA

**Context.** The sibling project Receipto is a Vite SPA. This is the one place the two
diverge.

**Decision.** TanStack Start with SSR, deployed through Nitro's Vercel preset.

**Reason.** In Algeria a product link is shared on WhatsApp and Facebook, and the preview
card is the storefront. WhatsApp and Facebook crawlers need `og:` tags present in the
initial HTML. Client-injected meta tags are unreliable for WhatsApp specifically. Product
URLs also need to be indexable.

**Consequences.** The app needs a Node runtime rather than being servable as pure static
files. Supabase is required either way, so "works on any static host" was never fully
true.

---

## 4. One `schema.sql`, no migration files

**Context.** The owner's master rules require a versioned migration per schema change.
That rule is correct for a long-lived production app and actively harmful here.

**Decision.** A single `supabase/schema.sql`, edited directly, applied by pasting.

**Reason.** A shop owner installs this with an AI agent pasting one file. A folder of
twenty ordered migrations is the highest-failure-rate step in agent-driven setup.

**Consequences.** No rollback story at the schema level; recovery means restoring a
backup. Mitigated by a tested backup-and-restore in the launch checklist. Documented as
a project-level adaptation in `PROJECT.md`.

---

## 5. Cash on delivery only in v1

**Context.** Cash on delivery is roughly 90% of Algerian e-commerce transactions
(UNCTAD, 2025).

**Decision.** v1 ships COD. Card payments are optional per shop, later, and run against
that shop's own provider account.

**Reason.** No Algerian payment provider supports split payments or sub-merchant
payouts. Verified against the full API surface of Chargily, SofizPay, eDahab and SATIM
itself. A foreign entity cannot obtain a CIB or Edahabia merchant ID without Algerian
registration, and only 644 authorised web merchants existed at end-2025.

**Consequences.** The platform never touches money, so there is nothing to license and
nothing to lose to fraud. The cost is that online payment conversion is left on the
table until each shop owner signs up with a provider themselves.

---

## 6. Guepex (Yalidine) for delivery, behind an abstraction

**Context.** The owner's `yalidine-integration` skill, built from the official API
documentation, supersedes community reverse-engineered adapters.

**Decision.** Ship the skill inside this repo at `docs/skills/yalidine-integration/` and
consume it. Abstract the carrier behind an interface so ZR Express can be added later
without touching checkout.

**Reason.** The skill documents details that reverse-engineered adapters get wrong:
parcel creation takes an array even for a single parcel and partial batch failure is
normal; wilaya and commune are matched by exact name string; personal data returns masked
on every read; edits only work while the parcel is in preparation.

**Consequences.** The webhook is a Supabase Edge Function, which is the first server-side
runtime in this project beyond the Nitro SSR bundle. `GUEPEX_API_TOKEN` is server-only
and must never carry a `VITE_` prefix.

---

## 7. Burnt orange palette, on the Commerce Storefront reference system

**Context.** A colour palette was required. The reference design system's own
"Commerce Storefront" system (system 02) supplied the token vocabulary, component
structure, motion, spacing, radius and elevation.

**Decision.** Carry the reference system and its palette: burnt orange primary
(`#c2410c` light, `#fb923c` dark), a crimson secondary (`#e11d48`) and an amber
tertiary (`#b45309`). Two values deviate from the reference for contrast, both
measured rather than assumed. The reference primary `#d9480f` scores 4.29:1
white-on-orange and 4.02:1 orange-on-cream, under the 4.5:1 AA floor for text below
18.66px, so `#c2410c` is used: the same hue one step darker, at 5.18:1 and 4.85:1.
Muted text was darkened from `#78716c` to `#6b6460` for the same reason.

**Reason.** OpenStore is a platform, not a brand. Neutral-first chrome lets any
seller's product photography lead, whatever the vertical. The palette is carried
rather than invented, so the component CSS and the tokens do not fight.

**Correction.** This entry previously recorded an "Algerian Emerald" palette with
`--primary: #047857` on a green-cast neutral ladder. That palette was never shipped
and appears nowhere in `src/styles.css`. It was documented long after the code had
moved, and it was repeated in `FEATURES.md` until both were corrected. The earlier
text was wrong; the code was right.

**Consequences.** The reference's three fonts were Latin-only, so Cairo was added as
the Arabic fallback and an Arabic density override was introduced. Both are
additive; no structural rule from the reference was changed.

---

## 8. Self-hosted npm gate instead of pnpm

**Context.** The owner's global standard specifies `pnpm check`.

**Decision.** `npm run check`.

**Reason.** The audience installs with agents that run `npm install` and `node`. Keeping
the toolchain identical to what the README tells a non-technical owner to type removes a
whole class of setup failure. The gate's contents are unchanged.

---

## 9. A local ESLint plugin for the 250-line rule

**Context.** `max-lines` is a `[HARD]` rule in the owner's master files.

**Decision.** Implemented in `eslint-rules/index.mjs` as a local plugin.

**Reason.** No maintained `eslint-plugin-max-lines` is published for ESLint 9 flat
config; the two packages that existed 404. A local rule cannot drift or disappear with a
dependency update, and it is unit-tested like any other logic in the repo.

**Consequences.** Two local rules instead of one dependency. Covered by Vitest so the
arithmetic cannot regress silently.

---

## 10. Nitro is a beta dependency, accepted with a fallback

**Context.** `nitro@^3.0.260522-beta` is required for SSR deployment to Vercel.

**Decision.** Accept it, pinned, with a documented fallback.

**Reason.** TanStack Start SSR without a Nitro preset means hand-rolling a server entry.
The beta is already running in production in the owner's `aura-wear-dz`.

**Consequences.** If Nitro breaks, the fallback is a Vite SPA plus a build-time prerender
step for product pages, which is a real amount of work. Revisit when Nitro reaches 3.0
stable.

---

## 11. The size guide editor asks for three things, not one

**Context.** The editor was a textarea expecting a tab-separated table, with a
placeholder as the only instruction, and every label written in Arabic regardless of
the owner's language. The owner reported it as confusing and predicted that shop
owners would be too. Fashion returns run 35 to 50 percent without a size guide
against 8 to 15 percent with one, so this is load-bearing rather than polish.

**Decision.** Ask for three things. The table, as an editable grid with add and
remove for rows and columns. The unit, carried in the column labels. And how the
measurements were taken, as a prompted textarea rather than an optional extra. A
clothing template fills a worked example, and pasting a spreadsheet still replaces
the whole table in one action.

**Reason.** Nielsen Norman Group's sizing research found the most common failure is
a chart that never explains how a measurement was taken, whether a shoe length is
inner or outer, so a buyer cannot act on the number. Shopify's guidance adds that
most shoppers do not own a tape measure. A table of bare numbers therefore cannot do
the job alone, and the original editor made entering the numbers hard as well, which
is the opposite of the point.

**Consequences.** Saving is refused until there is at least one column. The unit
lives in the column labels instead of its own field, because a separate field would
have to be combined with the headers anyway and two sources of truth invite drift.
The paste path is kept, because an owner whose numbers are already in a spreadsheet
should not be made to retype them. The grid's operations are pure functions in
`src/lib/size-guide-grid.ts`, unit-tested at the edges that matter: removing the last
column, and pasting a ragged copy.

---

## 12. Order export runs in the database, and signs its payload

**Context.** Owners wanted orders to land in a Google Sheet as well as in the app.
Algerian shops reconcile in spreadsheets, and an app that makes them retype data
loses to a notebook.

**Decision.** Destinations live in `order_export_targets`, owner-readable only. A
trigger on `orders` queues an asynchronous POST per enabled destination through
`pg_net`, with an HMAC-SHA256 signature over the raw body, on creation and on every
status change. Off by default, and any number of destinations.

**Reason.** Three options were considered.

An _Apps Script web app_ is the receiver. It needs no OAuth client, no Google Cloud
project, and no service account for the owner to create, and the owner keeps control
of their own sheet. The alternative, a service account with the Sheets API, needs a
Google Cloud project per shop and a JSON key to store, which is a much larger thing
to ask of someone setting up a shop from their phone.

_pg_net over an Edge Function_ is about placement. `pg_net` queues the request and
sends it after the transaction commits, so a slow or dead endpoint cannot delay or
fail a checkout. An Edge Function in the middle would add a network hop and a second
component to misconfigure, for nothing. It also keeps the URL and the secret out of
the browser entirely: no client ever holds them, and there is nothing for the
storefront bundle to leak.

_Signing at all_ is because an Apps Script endpoint has to be public. Without a
signature the URL alone is a bearer token, and anyone who obtains it can inject
orders into the shop's spreadsheet. The signature is the only thing separating a
real order from a forged one.

**Consequences.**

The signature travels as a query parameter _and_ a header, which is not redundancy.
Google Apps Script cannot read request headers at all: the event object passed to
`doPost()` has no `headers` field and never has had one (Google issue 67764685, open
since 2017). Since Apps Script is the reason the feature exists, a header-only
signature would have been unverifiable for the one integration it was built for.
This was caught by the Sprint Research Gate before the UI was written, not after a
shop owner reported it.

The body sent by `pg_net` was verified byte-for-byte identical to `payload::text`,
so a receiver recomputing the digest over what it received gets the same value. That
is not obvious and would have failed silently.

Supabase grants broad default privileges on new tables to `anon`, so `anon` started
out holding `SELECT` and `TRUNCATE` on both new tables. RLS returns no rows to
`anon` because the policies target `authenticated`, but a signing secret should not
be one dropped policy away from being readable, and `TRUNCATE` ignores RLS entirely.
Both are revoked explicitly, the same treatment `orders` already gets.

Delivery outcomes are not surfaced in the app beyond a "queued" log row, because
`pg_net` is asynchronous and the shop does not see the response. The raw outcome is
in `net._http_response` for six hours, which `docs/GOOGLE_SHEETS.md` tells the owner
how to read. A per-target health indicator would be better and is recorded in
`docs/LATER.md`.
