# Security Policy

## Reporting a vulnerability

Please **do not open a public issue**. Use GitHub's private reporting:

**Security → Report a vulnerability** at
`https://github.com/Meykiio/openstore-dz/security/advisories/new`

Include what you found, how to reproduce it, and what an attacker gains. You will get an
acknowledgement within a few days.

## What OpenStore does and does not protect

**Does**

- Row Level Security on every table, so the browser can only read and write what the
  policies allow.
- Prices computed on the server. A tampered browser payload cannot change what a buyer
  is charged.
- A publishable Supabase key only. The service-role key never reaches the client.
- Delivery webhooks verified with HMAC-SHA256 over the raw request body, so a forged
  delivery update is rejected.
- Input validated again in database triggers, not only in the UI.

**Does not**

- Protect against a shop owner with a compromised admin account. That account can do
  anything an owner can, by design.
- Keep the shop owner's money safe, because OpenStore never holds it. The courier
  collects cash from the buyer.
- Provide a refund mechanism. Cash on delivery means a refusal is the refund.

## Deployment responsibility

This project runs on each shop owner's infrastructure. If you self-host, these are yours:

- Keep the Supabase project on the free or paid tier appropriate to your volume, and
  turn on automated backups.
- Keep `GUEPEX_API_TOKEN` and any service-role key out of the client bundle. If either
  ever appears in a `VITE_`-prefixed variable or in browser code, rotate it immediately.
- Enable email confirmation in Supabase Auth once you have real staff accounts. During
  setup it is off so a new install is not blocked; that is not a safe production state.
- Put the site behind HTTPS.

## Legal context specific to Algeria

If you sell on this platform, you are operating under Algerian law. The platform is
designed to help you publish the disclosures Law 18-05 requires, but the obligation is
yours. See `docs/DATABASE.md` for the exact fields, and note that this is not legal
advice.

Loi 25-11 of 24 July 2025 applies to the personal data OpenStore stores: customer name,
phone number and delivery address. It requires a processing register and an automated
processing log, and notification to the ANPDP within 5 days of a breach.
