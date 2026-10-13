# OpenStore DZ

**Free, self-hosted e-commerce for Algerian small businesses and individuals.**

[![License: AGPL-3.0-only](https://img.shields.io/badge/License-AGPL--3.0--only-blue.svg)](LICENSE)
[![CI](https://github.com/Meykiio/openstore-dz/actions/workflows/ci.yml/badge.svg)](https://github.com/Meykiio/openstore-dz/actions/workflows/ci.yml)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

Arabic (RTL) first. French. Cash on delivery. No subscription, no setup fee, no paywall.

> **العربية**: [اقرأ هذا الملف بالعربية](README.ar.md) · **Français**: [Lisez ce fichier en français](README.fr.md)

---

## Status: foundation, not yet a shop

**This is v0.1.0 and it is not usable as a shop yet.** The foundation is built and
verified: the app runs, the quality gate is green, and the design system is in place. The
catalogue, checkout and dashboard are being built in order, and this file will say so the
moment each one is verified.

| Sprint | What it delivers                                           | State                         |
| ------ | ---------------------------------------------------------- | ----------------------------- |
| 0      | Project foundation, quality gate, design system            | **Done**                      |
| 1      | Skill library, design reference, governance docs           | **Done**                      |
| 2      | `supabase/schema.sql`: tables, RLS, grants, seed demo shop | **Done, verified on live DB** |
| 3      | Admin sign-in and store profile                            | Next                          |
| 4      | Products, packs, size guide builder                        | Planned                       |
| 5      | Orders and the confirmation call queue                     | Planned                       |
| 6      | Storefront, product pages, installable PWA                 | Planned                       |
| 7      | Cart and cash-on-delivery checkout                         | Planned                       |
| 8      | Guepex delivery, tracking, webhook                         | Planned                       |
| 9      | Full accessibility and performance gates                   | Planned                       |
| 10     | Launch readiness                                           | Planned                       |

> **Sprint 2 is live.** The schema is applied to the project database and was exercised
> end to end: an order was placed through `place_order`, priced server-side, tracked through
> `track_order`, and confirmed to roll back whole when a line was invalid. `anon` holds no
> table privileges on `orders`. Supabase's security and performance advisors were run and
> both real findings were fixed.

`docs/CHANGELOG.md` records verified state. If it is not in the changelog, it does not
work yet.

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

## What it will do

- **Storefront** in Arabic RTL, mobile-first, that a shop owner can run themselves
- **Products and packs**, with colour and size variants and multi-image galleries
- **Size guide builder** — the single highest-return feature for clothing, which cuts
  returns from 35–50% to 8–15%
- **Cash-on-delivery checkout**, with the delivery fee shown _before_ the buyer commits
- **Confirmation call queue** — the feature Algerian merchants ask for by name, because a
  pre-dispatch phone call cuts refused deliveries by 25–35%
- **Guepex (Yalidine) delivery** with parcel creation, fee preview and live tracking
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

## Getting started

### Prerequisites

| Tool             | Why                                                          |
| ---------------- | ------------------------------------------------------------ |
| **Git**          | to clone the repository                                      |
| **Node.js 20+**  | to build and run the app                                     |
| **npm**          | comes with Node.js                                           |
| **Docker**       | to run Supabase locally, or use a free cloud project instead |
| **Supabase CLI** | run `npx supabase --version` to check                        |

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
   - Node.js 20+: `node -v`
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
   Preferred, non-interactive:  npx supabase db reset --local
   That applies the schema and the seed data in a single command.
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

5. RUN THE QUALITY GATE. Run `npm run check`. Report the result honestly.
   It runs typecheck, lint, tests, a dead-code scan and a production build. If any step
   fails, fix the cause and re-run. Do not claim it passed unless it exited 0.

6. FINAL REPORT. Print a clear summary:
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
Dashboard. When Sprint 8 lands, the full walkthrough is in
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
