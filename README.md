# OpenStore DZ

**Free, self-hosted e-commerce for Algerian small businesses and individuals.**

[![License: AGPL-3.0-only](https://img.shields.io/badge/License-AGPL--3.0--only-blue.svg)](LICENSE)
[![CI](https://github.com/Meykiio/openstore-dz/actions/workflows/ci.yml/badge.svg)](https://github.com/Meykiio/openstore-dz/actions/workflows/ci.yml)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

Arabic (RTL) first. French. Cash on delivery. No subscription, no setup fee, no paywall.

> **العربية**: [اقرأ هذا الملف بالعربية](README.ar.md) · **Français**: [Lisez ce fichier en français](README.fr.md)

---

## Status: v0.1.0, first public release

**Live demo: [openstore-dz.vercel.app](https://openstore-dz.vercel.app)**, a real
clothing catalogue running on this exact code.

> **The demo is a showroom, not a shop.** Orders placed there are never shipped.
> OpenStore is not a hosted service: there is no central OpenStore website where
> shops live. Each owner installs their own copy, with their own database, their
> own domain and their own orders, using the setup prompt below. Nobody else,
> including the author of this project, can see your shop's orders or customers.

A shop owner can install this today and start taking cash-on-delivery orders. Verified
and working, in `docs/FEATURES.md`:

- **Buyers:** catalogue with search and filters, product pages with colour and size
  pickers, zoomable photos, size guide, reviews and related products. Home delivery or
  pickup at the carrier's office, with both prices shown before ordering, and commune
  suggestions for all 69 wilayas. Sale prices, WhatsApp ordering, order tracking.
  Arabic, French and English, rendered in the buyer's language from the first byte.
  Installable on a phone.
- **Owners:** a setup wizard (name, logo, colour, phone, delivery prices for every
  wilaya, legal details) and a checklist until nothing is left as a demo value. A
  dashboard that opens on the confirmation call queue, refusal rate by wilaya,
  protection against fake orders (a limit per phone number, a blocklist, each number's
  refusal history), shipping labels for 100 x 150 mm thermal printers or four per A4,
  CSV export. Products with a colour x size generator and photos per colour,
  categories, size guides, review moderation, Guepex parcels.
- **Safety:** prices and delivery fees are computed in the database, never trusted from
  the browser. Row-level security on every table. Secrets stay on the server. The
  platform never holds the shop's money.

What it does **not** do yet, so nobody finds out the hard way:

- **One carrier.** Guepex (Yalidine) only. Other carriers are on the roadmap.
- **Delivery status sync needs your Guepex webhook secret.** Until you set
  `GUEPEX_WEBHOOK_SECRET`, parcels are created but their status is updated by hand.
- **Pickup offices are listed from Guepex.** Without a Guepex key, you choose the
  office on the order before creating the parcel.
- **No card payments.** Cash on delivery only, by design: the money goes from the
  buyer to the courier to you.

`docs/CHANGELOG.md` records what was actually run and verified. If it is not there, it
does not work yet.

---

## Why this exists

Shop owners in Algeria were given three options: pay 999 DZD a month plus a
35,000 to 65,000 DZD setup fee for a SaaS storefront, build something themselves on
Shopify or WooCommerce, or keep selling through Instagram and Facebook DMs.

That last option is not a small market. **47.4% of Algerian online purchases happen on
social networks**, against 31.8% on merchant websites. Owners are selling, taking orders
by DM, and losing the customer record every time. Jumia, the one venture-backed
marketplace, **exited Algeria in March 2026**.

OpenStore is a proper storefront that costs nothing, installs in one step, and speaks
Arabic properly. Most Algerian storefronts declare `lang="fr"` with no text direction at
all, and load a Latin font that renders Arabic as whatever the operating system picks.
That is not a design decision anyone made. It is the gap.

---

## What it does

- **Storefront** in Arabic RTL first, French and English, mobile-first
- **Products and packs**, with colour and size variants generated in one go
- **Size guide builder**, the single highest-return feature for clothing, which cuts
  returns from 35-50% to 8-15%
- **Cash-on-delivery checkout**, home or pickup office, with the fee shown _before_ the
  buyer commits
- **Confirmation call queue**, the feature Algerian merchants ask for by name, because a
  pre-dispatch phone call cuts refused deliveries by 25-35%
- **Fake-order protection**, because a refused parcel costs the shipping both ways
- **Guepex (Yalidine) delivery** with parcel creation and tracking, and printable labels
- **WhatsApp ordering**, a prefilled message for the buyer who will not fill a form
- **Reviews**, which are absent from essentially every Algerian storefront today
- **Nothing the platform sells.** No subscription, no commission, no "pro tier".

---

## Tech stack

| Layer        | Choice                                                           |
| ------------ | ---------------------------------------------------------------- |
| Framework    | React 19, TanStack Start v1 (SSR), Vite 7, Nitro (Vercel preset) |
| Styling      | Tailwind CSS v4, CSS-first tokens, shadcn-style primitives       |
| Data         | Supabase: Postgres + Auth + Storage + Edge Functions             |
| Server state | TanStack Query                                                   |
| Delivery     | Guepex (formerly Yalidine)                                       |
| Licence      | AGPL-3.0-only                                                    |

---

## Deploy your own shop (no computer setup)

OpenStore goes into **your own** GitHub, Vercel and Supabase accounts. The shop, its
database and its orders belong to you; nobody else can see them. About ten minutes, all
free tiers, in this order:

1. **Create the database first.** Make a free project at
   [supabase.com](https://supabase.com). In its **SQL Editor**, paste the whole of
   [`supabase/schema.sql`](supabase/schema.sql) and click **Run**. It ends with
   "Success". Skipped this? The deployed site notices the empty database and walks you
   through it, with a link to your SQL Editor and a button that copies the script.
2. **Deploy.** Click the button and, when Vercel asks, paste three values from Supabase
   → **Project Settings → API**: the Project URL, the publishable (anon) key, and the
   project ref. Never paste the `service_role` key here.

   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FMeykiio%2Fopenstore-dz&env=VITE_SUPABASE_URL,VITE_SUPABASE_PUBLISHABLE_KEY,VITE_SUPABASE_PROJECT_ID&envDescription=From%20your%20Supabase%20project%3A%20Project%20Settings%20%E2%86%92%20API&project-name=my-shop&repository-name=my-shop)

   Changed a key later? Vercel only reads them when it builds, so open **Deployments**
   and click **Redeploy**.

3. **Claim your shop.** Open `https://<your-site>/setup` straight away and create
   the owner account. Until you do, anyone who finds the address could claim it.
   The setup wizard then asks for your name, phone, delivery prices and legal
   details.
4. **Close the door behind you.** In Supabase → **Authentication**, set the Site
   URL to your Vercel address and turn off **Allow new users to sign up**. Your
   owner account keeps working.

Prefer your own machine, or want an AI agent to do it for you? Read on.

---

## Updating your shop

Already running a shop? [UPDATING.md](UPDATING.md) walks you through it in about five
minutes, without a computer setup: one click in GitHub's Actions tab for the code, one
paste into the Supabase SQL Editor for the database. Your dashboard tells you when a new
version is out and when the database needs the update.

---

## Getting started

### Prerequisites

| Tool               | Why                                                          |
| ------------------ | ------------------------------------------------------------ |
| **Git**            | to clone the repository                                      |
| **Node.js 20.19+** | to build and run the app                                     |
| **npm**            | comes with Node.js                                           |
| **Docker**         | to run Supabase locally, or use a free cloud project instead |
| **Supabase CLI**   | run `npx supabase --version` to check                        |

### Quick start

```bash
git clone https://github.com/Meykiio/openstore-dz.git
cd openstore-dz
npm install
npx supabase start          # or create a free project at supabase.com
cp .env.example .env        # paste your URL and publishable key
npm run dev                 # http://localhost:8080
```

The one-click prompt below does all of that for you, including filling in the keys.

---

## One-click setup prompt — paste this into your AI assistant

Copy everything inside the code block, paste it into Claude Code, Claude Desktop, Cursor,
opencode, Gemini CLI or Windsurf, and let it do the work. It detects your operating
system, installs anything missing, and verifies every step rather than assuming it worked.

```text
You are setting up OpenStore DZ, a free self-hosted e-commerce platform for Algerian
small businesses (React 19 + TypeScript + Vite + TanStack Start + Supabase), for a
non-technical shop owner. Work autonomously, verify every step, and explain each step in
one plain-language sentence. Never skip a failed verification: diagnose the root cause,
fix it, and re-run before continuing.

GOAL (both paths): OpenStore running at http://localhost:8080 with a working database,
the schema applied, and a verified clean quality gate.

FIRST, ASK ONE QUESTION before installing anything:
"Do you want OpenStore to use a database on your own computer (Docker, fully private and
free) or your own free Supabase cloud project (no Docker needed)?"
Wait for the answer, then follow PATH A or PATH B.

STEPS:

0. DETECT THE PLATFORM FIRST. Determine the OS (Windows, macOS, Linux) and the CPU
   architecture. Use the platform-appropriate commands and package managers below.
   Report which OS you detected. On Windows, also note whether you are in PowerShell,
   cmd, or Git Bash and use the correct syntax for each.

1. VERIFY PREREQUISITES. Check each tool; install anything missing using the
   OS-appropriate method. Report exactly what you installed and whether a restart is
   needed.
   - Git: `git --version`
       Windows: winget install Git.Git  |  macOS: brew install git  |  Linux: apt install git
   - Node.js 20.19 or newer: `node -v`
       Windows: winget install OpenJS.NodeJS.LTS  |  macOS: brew install node  |  Linux: apt install nodejs npm  (or use nvm)
   - npm: `npm -v`
   - Docker (must be RUNNING, not just installed): `docker version`
       Windows/macOS: Docker Desktop, winget install Docker.DockerDesktop (requires a
       restart and the WSL2 backend) | brew install --cask docker
       Linux: Docker Engine, then `sudo systemctl enable --now docker`
   - Supabase CLI: `npx supabase --version`

2. CLONE. If the current folder is not already the project:
   git clone https://github.com/Meykiio/openstore-dz.git
   cd openstore-dz

3. INSTALL DEPENDENCIES.
   npm install
   Report honestly if it fails and fix the root cause before continuing.

--- PATH A: LOCAL DATABASE (Docker) ---

A1. START SUPABASE LOCALLY. Run `npx supabase start`. Docker must be running. Wait for it
   to print the API URL, the anon key, the Studio URL and the DB URL. If a port is busy or
   Docker is not running, diagnose and fix before continuing. A "not linked" message is
   expected here: local start does not need a linked cloud project.

A2. APPLY THE DATABASE SCHEMA. Read `supabase/schema.sql` and run its FULL contents
   against the local database, once.
   Preferred, non-interactive (bash, Git Bash on Windows, macOS, Linux):
     docker exec -i supabase_db_openstore-dz psql -U postgres -v ON_ERROR_STOP=1 < supabase/schema.sql
   Do NOT use `npx supabase db reset` for this: the CLI's seed loader cannot run a
   file that creates tables, and leaves an empty database. In Windows PowerShell,
   run the line above from Git Bash, because PowerShell's `<` is not redirection.
   Alternative: open Studio (usually http://127.0.0.1:54323) -> SQL Editor, paste the whole
   file, and Run.
   Verify: `select count(*) from public.store_settings;` should return 1, and
   `select count(*) from public.products;` should return the number of seeded demo
   products (not 0).

A3. ENVIRONMENT. Create `.env` in the project root. Never commit it.
   VITE_SUPABASE_URL=<API URL, for example http://127.0.0.1:54321>
   VITE_SUPABASE_PUBLISHABLE_KEY=<anon key printed by supabase start>
   VITE_SUPABASE_PROJECT_ID=local

A4. EMAIL CONFIRMATION is off by default locally, so sign-up works immediately.

--- PATH B: SUPABASE CLOUD (no Docker) ---

B1. ASK THE USER FOR TWO VALUES from their free Supabase project
   (supabase.com -> the project -> Project Settings -> API):
     - Project URL (https://<ref>.supabase.co)
     - the publishable/anon key (this key is public and safe in .env; the service_role
       key is NOT and must never be used here)
   If they have no project yet, walk them through creating one on the free plan.

B2. TELL THE USER TO DISABLE EMAIL CONFIRMATION, and explain why.
   Supabase dashboard -> Authentication -> Sign In / Providers -> Email -> turn OFF
   "Confirm email" -> Save.
   A fresh cloud project has it ON, which blocks sign-up entirely and burns the small
   free email quota. This step is required. Tell the user plainly that they should turn it
   back ON later once real staff accounts exist.

B3. APPLY THE SCHEMA ONCE. Dashboard -> SQL Editor -> New query. Read
   `supabase/schema.sql` and paste its FULL contents, then Run.
   Verify: `select count(*) from public.store_settings;` should return 1.

B4. ENVIRONMENT. Create `.env` (never commit it) with:
   VITE_SUPABASE_URL=<Project URL>
   VITE_SUPABASE_PUBLISHABLE_KEY=<publishable/anon key>
   VITE_SUPABASE_PROJECT_ID=<your project ref>

--- FINISH (both paths) ---

4. START THE APP. Run `npm run dev` in the background. Confirm http://localhost:8080 loads.
   The page shows a "Database connected" check when the keys work. If it shows
   "Database not configured yet" or "Could not reach the database", stop and fix the
   problem before continuing. Do not report success while that check is failing.

5. CREATE THE OWNER ACCOUNT. Tell the user to open http://localhost:8080/setup and
   create their account there. The first account created becomes the shop owner, and
   the page closes for everyone else afterwards. Do this before the shop is shared
   with anyone. Verify: http://localhost:8080/admin opens the dashboard after sign-in.

6. RUN THE QUALITY GATE. Run `npm run check`. Report the result honestly.
   It runs typecheck, lint, tests, a dead-code scan and a production build. If any step
   fails, fix the cause and re-run. Do not claim it passed unless it exited 0.

7. FINAL REPORT. Print a clear summary:
   - What is running and where (app URL; Studio URL on PATH A, or the Supabase dashboard
     on PATH B)
   - The daily commands: PATH A - start Docker, `npx supabase start`, `npm run dev`.
     PATH B - `npm run dev`. How to stop everything.
   - What still needs the shop owner to do by hand, and where to find the instructions
   - Any unresolved issue, with its exact error message

HARD RULES:
- Never commit secrets or .env files. Never run `git commit` at all; the owner commits.
- Never modify the database except through `supabase/schema.sql`.
- The service_role key must never appear in the app, in `.env`, or in your reply.
- Do not add dependencies.
- If a step cannot be completed, STOP and explain exactly what is missing rather than
  improvising or guessing a value.
```

### After setup: Guepex delivery credentials

No AI agent can generate these. They exist only inside your own Guepex Developer
Dashboard. The full walkthrough is in
`docs/skills/yalidine-integration/references/human-only-steps.md`. Do not paste these
values into a chat with an agent; put them straight into `.env`:

```
GUEPEX_API_ID=
GUEPEX_API_TOKEN=
GUEPEX_BASE_URL=https://api.guepex.app/v1/
GUEPEX_WEBHOOK_SECRET=
```

---

## Documentation

| File                                | What it covers                                                                           |
| ----------------------------------- | ---------------------------------------------------------------------------------------- |
| `docs/PROJECT.md`                   | Current state, scope, and the adaptations this project makes to the owner's master rules |
| `docs/ARCHITECTURE.md`              | How the system fits together and how requests flow                                       |
| `docs/DATABASE.md`                  | Schema, RLS, grants, triggers, and Algerian legal requirements                           |
| `docs/FEATURES.md`                  | Verified feature set. Nothing here is aspirational                                       |
| `docs/PROJECT_STRUCTURE.md`         | How the code is organised                                                                |
| `docs/DEPLOY.md`                    | Putting a shop online                                                                    |
| `docs/DECISIONS.md`                 | Decisions already made, and why                                                          |
| `docs/CHANGELOG.md`                 | What actually changed, per sprint                                                        |
| `docs/skills/yalidine-integration/` | Guepex delivery integration for AI agents                                                |
| `AGENTS.md`                         | Rules for any AI agent working in this repo                                              |

## Verification

```bash
npm run check     # typecheck, lint, tests, dead code, production build
```

This must pass before every commit. A failing gate blocks the commit; a check is never
disabled to make it pass.

## Contributing

See `CONTRIBUTING.md`. The most useful contribution is not code: it is installing this,
using it for a week as a shop owner, and reporting what was confusing.

## Security

See `SECURITY.md`. Report vulnerabilities privately, not in a public issue.

## Licence

[AGPL-3.0-only](LICENSE). OpenStore is free software and stays free. You may use it
commercially, study it, and change it, but anyone you serve a modified copy of it over a
network must also offer their source. This is deliberate: it is what keeps the platform
community-owned.

---

**© 2026 Sifeddine Mebarki** — built for the Algerian community, with global ambitions.
