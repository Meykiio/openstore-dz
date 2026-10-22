# Contributing to OpenStore DZ

Help is wanted. Most of it does not require being a developer.

## What help is most useful

OpenStore exists because shop owners in Algeria were paying 999 DZD a month plus a
35,000 to 65,000 DZD setup fee, or selling through Instagram DMs, because there was no
affordable option. The most valuable contributions, in rough order:

1. **Reports from real shop owners.** Install it, use it for a week, tell us what broke
   or was confusing. This is worth more than any code.
2. **Arabic and French wording.** If you are a native speaker, the wording in a screen
   being unclear to a shop owner is a bug.
3. **Wilaya and commune data accuracy.** Delivery only works if these names match the
   carrier's spelling exactly. A single wrong character fails a parcel.
4. **Translation to Tamazight or Darija**, if you can do it accurately.
5. **Code.** Typecheck, lint, tests and dead-code scan must pass.

## Setup

```bash
git clone https://github.com/Meykiio/openstore-dz.git
cd openstore-dz
npm install
cp .env.example .env
```

Then follow the setup prompt in `README.md`. You need a Supabase project, either local
via Docker or free in the cloud.

## Before you open a pull request

```bash
npm run check
```

This runs typecheck, lint, 19 tests, a dead-code scan and a production build. All must
pass. If you touch the database, also run:

```bash
npx supabase db advisors
```

## Rules that are not negotiable

- Max 250 lines per file, 120 per function. ESLint enforces it.
- Never commit `.env` files, API tokens, or database credentials.
- Database changes go in `supabase/schema.sql`, never through the Supabase console.
- If you touch layout, check Arabic RTL and both themes.
- Prices are computed on the server. Never trust a price from the browser.
- The platform never holds a shop owner's money. Do not propose a feature that makes it.

## Commit messages

```
feat(orders): add refusal reason field
fix(checkout): keep delivery fee visible after submit
docs(setup): clarify the Docker path in the README prompt
refactor: split OrderRow out of OrderList
test: cover the delivery fee calculator
```

## Database changes

`supabase/schema.sql` is the single source of truth. There are no migration files by
design, so that a shop owner can install with one paste.

- Read the existing schema before changing it.
- Every new table needs Row Level Security **and** a base `GRANT`. PostgREST checks
  grants before policies; without the grant you get a 401 that looks like a policy bug.
- Every policy needs a `WITH CHECK` clause, or a row can be updated into someone else's
  ownership.
- Wrap policy function calls in `(select fn())` so they evaluate once per statement
  instead of once per row.

## Reporting security issues

Do not open a public issue. See `SECURITY.md`.

## Licence

Contributions are accepted under AGPL-3.0-only, the same licence as the project.
