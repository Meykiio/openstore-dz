# DEPLOY

Putting a shop online. Every step here is verified before it is written here.

**Verified once, on Vercel.** The reference shop runs at
https://openstore-dz.vercel.app, built from this repository with the steps below. A
Netlify or VPS deployment has not been tried by anyone yet.

## What gets built

```bash
npm run build
```

This produces `.vercel/output/` using the Vercel Build Output API:

```
.vercel/output/
├── config.json
└── functions/__server.func/index.mjs    the Nitro SSR entry
```

That is a Node 20+ runtime. The same output works on Vercel, Netlify, or a VPS.

## Vercel

1. Push the repository to GitHub.
2. **vercel.com/new** → Import Git Repository.
3. Framework preset: leave on auto-detect. Nitro's Vercel output is recognised.
4. Build command: `npm run build`.
5. Output directory: leave default. Nitro writes to `.vercel/output/`.

### Environment variables

Add these in **Project → Settings → Environment Variables**, for Production, Preview and
Development:

| Name                            | Scope      | Value                                                 |
| ------------------------------- | ---------- | ----------------------------------------------------- |
| `VITE_SUPABASE_URL`             | client     | your Supabase Project URL                             |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | client     | publishable / anon key. Public, safe in the bundle    |
| `VITE_SUPABASE_PROJECT_ID`      | client     | your project ref                                      |
| `VITE_SITE_URL`                 | client     | the public origin, for Open Graph URLs                |
| `GUEPEX_API_ID`                 | **server** | from your Guepex dashboard                            |
| `GUEPEX_API_TOKEN`              | **server** | from your Guepex dashboard. Never prefix with `VITE_` |
| `GUEPEX_WEBHOOK_SECRET`         | **server** | from your Guepex webhook dashboard                    |

A variable with no `VITE_` prefix never reaches the browser. If a secret ever appears in
browser code, rotate it immediately. See `SECURITY.md`.

### Claim the shop immediately

Open `https://<your-domain>/setup` as soon as the first deploy finishes and create the
owner account there. Until someone does, **anyone who finds the URL can claim the shop
and become its owner.** After the first claim the page closes permanently.

### Supabase Auth

In **Authentication → URL Configuration**:

- **Site URL:** your production origin.
- **Redirect URLs:** the production origin, the preview pattern, and
  `http://localhost:8080/**` for local development.

If the Site URL still points at localhost, any Auth redirect bounces to the wrong place.

### Email confirmation

During setup, confirm-email is turned **off** so a fresh project is not blocked. Once you
have real staff accounts, turn it **on**. Email confirmation off is not a safe production
state.

### Guepex webhook

The webhook is a Supabase Edge Function:

```
https://<project-ref>.supabase.co/functions/v1/guepex-webhook
```

Create the subscription in your Guepex Webhooks Dashboard pointing at that URL, then put
the returned secret into `GUEPEX_WEBHOOK_SECRET` and redeploy.

The endpoint answers a CRC challenge that Guepex re-validates periodically. If the CRC
logic is ever removed, the webhook is disabled **silently** and delivery updates simply
stop arriving. It is load-bearing; leave it in place. See
`docs/skills/yalidine-integration/references/webhooks-reference.md`.

## Netlify or a VPS

The build output is plain Node. On any Node 20+ host:

```bash
npm ci
npm run build
node .vercel/output/functions/__server.func/index.mjs
```

with the same environment variables set. No adapter required.

## Backups

Supabase free tier does not give you point-in-time restore. Before you take real orders:

1. Turn on daily backups in Supabase → Database → Backups, or
2. Run `supabase db dump` on a schedule and store the dump somewhere off-platform.

An untested backup is not a backup. Restore it into a scratch project and confirm your
products and orders are there. Sprint 10 includes exactly this.

## Rollback

Vercel: **Deployments** → pick a previous passing deployment → **Promote to Production**.
Takes effect in about a minute, no rebuild.

Database: this project has no migration files, by design, so there is no forward-only
rollback. If a schema change breaks production, restore the database from backup. This is
the known cost of the single-file schema, recorded in `docs/DECISIONS.md` entry 4.

Before changing `schema.sql` on a live shop, take a backup first.

## Checklist before going live

- [ ] `npm run check` passes in CI
- [ ] The shop is claimed at `/setup` by its real owner
- [ ] A test order completes end to end on a real phone
- [ ] Guepex webhook verified with a real parcel (`?subscribe=1&crc_token=test123`)
- [ ] Email confirmation turned **on**
- [ ] HTTPS on, domain configured, Supabase Auth URLs updated
- [ ] Legal disclosures from Law 18-05 Article 11 filled in and published
- [ ] Backups enabled and a restore tested
- [ ] Rollback rehearsed once, not just read about
- [ ] Tested at 360px width in Arabic RTL
