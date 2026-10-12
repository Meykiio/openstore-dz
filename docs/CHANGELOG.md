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