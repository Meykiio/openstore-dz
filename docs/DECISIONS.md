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

## 7. Algerian Emerald palette, on the Commerce Storefront reference system

**Context.** A colour palette was required. The reference design system's own
"Commerce Storefront" system (system 02) supplied the token vocabulary, component
structure, motion, spacing, radius and elevation.

**Decision.** Carry the reference system verbatim and replace only colour values with an
Algerian Emerald palette. `--primary` is `#047857` light and `#34d399` dark, on a
neutral ladder with a faint green cast.

**Reason.** OpenStore is a platform, not a brand. Neutral-first chrome lets any seller's
product photography lead, whatever the vertical. Green and white is the most loaded pair
in Algeria, so the default install reads as native without explanation.

**Consequences.** The reference's three fonts were Latin-only, so Cairo was added as the
Arabic fallback and an Arabic density override was introduced. Both are additive; no
structural rule from the reference was changed.

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