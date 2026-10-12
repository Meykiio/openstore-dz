# FEATURES

**Verified feature set.** Nothing on this page is aspirational. If a feature is not
listed here as working, it does not work yet. Sprint status lives in `README.md`; the
history of what changed lives in `CHANGELOG.md`.

## Working now

### Setup and diagnostics

- **First-run health check.** On load, the app verifies it can reach the database and
  reports one of: connected, not configured yet, or unreachable. A missing `.env` produces
  the exact three steps to fix it rather than a blank page or a console stack trace.
- **Light and dark themes.** Switching uses a `data-theme` attribute, so an explicit
  choice wins over the operating system setting. The theme is applied before first paint,
  so there is no flash of the wrong theme.
- **One-click agent setup.** `README.md` contains a prompt that installs prerequisites,
  starts or creates the database, applies the schema, fills the environment file, and
  verifies each step. Available in English, Arabic and French.

### Design system

- **Algerian Emerald palette** in both themes, from the Commerce Storefront reference
  system, with only colour values changed.
- **Arabic typography.** Fraunces, Outfit and IBM Plex Mono are self-hosted through
  Fontsource, with Cairo as the Arabic fallback. The reference fonts have no Arabic
  glyphs; without this, Arabic renders in whatever the operating system picks.
- **Arabic density override.** 17px at 1.75 line height against Latin's 15px at 1.5,
  because Arabic needs more air at the same nominal size.
- **RTL is the default**, not an option. Arabic is the primary language.
- **Reduced motion is respected.** Every animation and transition collapses under
  `prefers-reduced-motion`.

### Quality

- **Single gate:** `npm run check` runs typecheck, lint, tests, a dead-code scan and a
  production build. It must pass before every commit.
- **250-line file limit and 120-line function limit**, enforced by a local ESLint rule
  with its own unit tests, not by discipline.
- **No unused dependencies are possible to merge.** `knip` fails the gate if a
  dependency is not imported by shipped code.

## Planned, not yet built

Listed so the roadmap is visible, not to imply any of it works:

- Storefront catalogue and product pages with Open Graph meta for WhatsApp previews
- Products and packs with colour and size variants
- Size guide builder
- Cash-on-delivery checkout with the delivery fee shown before submit
- Confirmation call queue and refusal tracking
- Guepex parcel creation, fee preview, tracking and webhook
- Reviews and moderation
- French translation
- Installable PWA
- Accessibility and performance gates in CI

## Explicitly out of scope

- **Any feature that intermediates a shop owner's money.** No commission engine, no
  escrow, no platform wallet. No Algerian payment provider supports split payouts, and a
  foreign entity cannot obtain a CIB or Edahabia merchant ID without Algerian
  registration. See `docs/DECISIONS.md` entry 5.
- **Multi-shop marketplace features.** Cross-shop discovery, shared catalogue. See entry 1.
- **Hosted SaaS.** Each shop runs their own instance.