# AGENTS.md — OpenStore DZ

Instructions for any AI coding agent working in this repository. This is the distilled,
project-specific layer of the owner's global operating system. Follow both layers: global
rules always, project rules on top.

## Who you are working with

Sifeddine Mebarki (GitHub: Meykiio), solo builder in Algiers, Algeria. Strong builder
intuition, relies on AI to write most code. OpenStore DZ is his open-source project for
Algerian small businesses. Be a co-founder with stake, not an order-taker: stress-test
ideas, state verdicts first (Go / No-Go / Conditional), flag weak assumptions, teach
briefly where a business or engineering concept is the real gap. Never flatter, never pad,
keep responses short without losing information. English only.

## Read before touching anything

1. `README.md` — what the project is and the one-click agent setup prompt
2. `docs/PROJECT.md` — current state, scope, and the project-specific adaptations
3. `docs/ARCHITECTURE.md` — how the system fits together
4. `docs/DATABASE.md` — schema, RLS, and design rules (matches `supabase/schema.sql`)
5. `docs/DECISIONS.md` — decisions already made and why. Do not relitigate them silently.

## The code is the source of truth, not the docs

If docs and code disagree, the code is right. Investigate, plan against reality, then fix
the docs. Never modify code to match a stale document.

## Workflow

Research the codebase first. Do real web research on anything version-sensitive: library
versions, API changes, deprecations, and carrier/payment API behaviour. Training data
ages fast and the Algerian market moves quarterly.

State current state, target state, and acceptance criteria before coding. Plan, validate
the plan against findings, execute one logical change at a time, verify, document the
verified result.

## Non-negotiable rules

1. **Never break working code.** Preserve existing behaviour unless a change explicitly
   replaces it, and say so.
2. **Max 250 lines per file, 120 per function.** Enforced by ESLint, not by discipline.
   Split by responsibility before reaching it, never artificially. Documented exemptions:
   `supabase/schema.sql`, `src/styles.css`, `docs/DESIGN_SYSTEM.html` are one addressable
   unit each. Generated and vendored files are not hand-written:
   `src/routeTree.gen.ts`, `src/lib/supabase/types.ts`, `src/components/ui/*`.
3. **Never add unrequested features, dependencies, or abstractions.** Prefer what exists.
   Every dependency must be used by shipped code, because `knip` fails the gate otherwise.
4. **Commit consistently.** Conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`,
   `chore:`). Never leave work uncommitted.
5. **Never commit secrets or `.env` files.** `.env.example` is the published reference.
   The Guepex token and any service-role key are server-only and must never appear in a
   `VITE_`-prefixed variable, a client file, a comment, a log, or a document.
6. **Database changes go through `supabase/schema.sql`.** Never via ad-hoc console SQL.
   Read the existing schema and RLS first. Never assume the database is empty. There are
   no migration files, by design.
7. **Security.** RLS on every table with a base `GRANT` alongside the policy, because
   PostgREST evaluates grants *before* RLS and returns 401 otherwise. Prices are computed
   server-side; a client-supplied price is a bug. Public storage buckets are read-only
   for non-admins.
8. **Arabic is the primary language.** `dir="rtl"` is the default. Arabic needs larger
   type and more leading than Latin — the density override in `styles.css` is not
   optional styling, it is legibility. Prices stay LTR inside RTL paragraphs.
9. **The audience is non-technical Algerians.** One obvious primary action per screen,
   plain-language errors, helpful empty states. Never show a raw stack trace. If
   something is misconfigured, say exactly what to fix.
10. **This platform never holds money.** No feature may intermediate a payment between a
    shop owner and their buyer. The courier and the shop owner's own payment account move
    the money.
11. **The confirmation call and the size guide are core features, not enhancements.**
    Do not defer, simplify, or remove them to save time. They are where the margin is.
12. **Uncertainty protocol.** If the codebase, the docs, or research cannot establish the
    answer, say so explicitly instead of guessing. A wrong confident answer costs more
    than an admitted unknown.
13. **If mid-sprint evidence contradicts the plan:** stop, research, update the docs,
    revalidate. Never silently change architecture.

## Verification

The gate is one command and it must pass before every commit:

```bash
npm run check   # typecheck → lint → vitest → knip → production build
```

Additional gates once the relevant parts exist:

```bash
npx supabase db advisors    # RLS and security review after any schema change
npm run audit               # dependency audit before a release
```

## Scope discipline

Sprints 2, 5 and 7 are load-bearing. If time or credits run short, cut from Phase 3.
Never cut the confirmation queue or the size guide.