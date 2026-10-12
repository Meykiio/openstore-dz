# Support

## Before anything else

Paste the **one-click setup prompt** from `README.md` into your AI coding agent
(Claude Code, Claude Desktop, Cursor, opencode, Gemini CLI, Windsurf). It handles
prerequisites, the database, the schema, the environment file, and verification. It is
the fastest path for almost every problem.

## Common problems

**The page is blank or the database check says "not configured"**
Your `.env` file is missing or incomplete. It must contain `VITE_SUPABASE_URL` and
`VITE_SUPABASE_PUBLISHABLE_KEY`. Copy `.env.example` to `.env`, paste the values from
Supabase → Project Settings → API, then restart `npm run dev`.

**Sign-up does nothing on a fresh Supabase cloud project**
Email confirmation is on by default and blocks sign-up. Turn it off at
**Authentication → Sign In / Providers → Email → Confirm email**. Turn it back on once
you have real staff accounts.

**The agent says the database is "not linked"**
Expected on the local Docker path. `supabase start` runs a full local stack and does not
need a linked cloud project.

**A parcel was created but nothing arrives**
Wilaya and commune names are matched by **exact string**. A single wrong character or a
different spelling fails the whole parcel. Use the dropdown, never free typing.

**Orders arrive but the courier shows nothing**
Parcel creation takes an array even for one parcel, and partial failure is normal. Some
parcels in a batch succeed while others fail. Check each entry individually, and check
the parcel is not stuck in a draft state.

## Where to ask

- **Setup and installation:** GitHub Discussions
  `https://github.com/Meykiio/openstore-dz/discussions`
- **Bugs:** a new issue with the bug template
- **Security:** private reporting, not a public issue. See `SECURITY.md`

## Scope of support

This is a free, community-maintained, solo-built project. There is no guaranteed response
time and no paid support tier. If you need guaranteed support, this is not the right
tool for you, and that is not a failure: it is what "free" means.

## Before reporting a bug

1. Run `npm run check` and tell us the result.
2. Say whether you are on local Docker or Supabase Cloud.
3. Say whether you are testing in Arabic or French.
4. Copy the exact error text. A screenshot of a console stack trace is better than a
   paraphrase.