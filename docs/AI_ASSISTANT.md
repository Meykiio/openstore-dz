# Manage your shop from Claude (AI assistant)

Optional, off by default (0.3.0). Once connected, you can tell Claude "add a black
size M to the robe", "what came in today?" or "mark order 4F2A91C0 as confirmed",
on the web, on the desktop app or on your phone. Claude acts with your own owner
account, so it can do what you can do in the dashboard, and nothing more.

Built and run in production first on JOAT-store, a shop on this code (November 2026).

## Set it up (about ten minutes, once)

You need: your shop already deployed, and the owner account (the one that claimed the
shop at `/setup`). Staff accounts can never connect an assistant.

1. **Update the database.** If your dashboard says _Your database needs an update_,
   follow [UPDATING.md](../UPDATING.md), step D.
2. **Supabase > Authentication > URL Configuration.** Set **Site URL** to your shop's
   address, for example `https://my-shop.vercel.app` (no `/` at the end).
3. **Supabase > Authentication > OAuth Server.** Turn the OAuth server on. Set the
   **Authorization Path** to `/oauth/consent`. Turn on **dynamic client
   registration** (Claude registers itself; there is nothing to copy).
4. **In Claude** (claude.ai, desktop or phone): Customize, Connectors, Add, **Add
   custom connector**. Name: your shop's name. Address: `https://<your shop>/mcp`
   (Admin > Integrations shows it with a copy button). Then **Connect**.
5. A page of your shop opens. Sign in with the owner account and tap **Approve and
   connect**. You are sent back to Claude.
6. Open **Admin > Integrations** and check the assistant is listed as allowed.

Claude Code (developers): `claude mcp add --transport http shop https://<your shop>/mcp`,
then `/mcp` to sign in.

Custom connectors are available on every Claude plan (Free: one connector).

## What Claude can do (30 tools)

| Area     | Tools                                                                                     |
| -------- | ----------------------------------------------------------------------------------------- |
| Shop     | overview (orders waiting for the call, sales, refusals, low stock), settings (read, edit) |
| Products | list, show, create, edit, delete                                                          |
| Variants | add colours and sizes, edit, change price, delete                                         |
| Photos   | list, reorder, remove, **one-time upload link**                                           |
| Category | list, create, edit, delete                                                                |
| Delivery | list prices per wilaya, change one wilaya                                                 |
| Orders   | list, show, change status, add tracking, delete                                           |
| Reviews  | list, approve, delete                                                                     |

Left out on purpose: the flat delivery fee and free-shipping threshold (they change what
buyers pay; they stay in Settings), staff accounts, the phone blocklist, order export
targets (they hold a secret), Guepex parcels, and anything that sends a message out of
the shop.

**Photos.** A picture pasted in the Claude chat cannot reach a connector today. Claude
gives you a link instead (`/admin/upload/<code>`, valid 15 minutes, once). Open it on
your phone, pick the photos, and they are cut to the shop's 4:5 frame like any upload.
The link also takes a Google Drive file shared as _Anyone with the link_.

## How it is kept safe

- **Your account, your rules.** Claude signs in through Supabase's OAuth server and gets
  an ordinary token for the owner, with an extra `client_id` naming the assistant. Every
  query goes through the same Row Level Security as the dashboard. The service key is
  never used.
- **A switch in the database.** `has_admin_role()` refuses any assistant token unless the
  owner allowed that assistant in Admin > Integrations and its switch is on. Switching
  it off stops a stolen token at once, even one used directly against Supabase.
- **Deletes and price changes take two steps.** The first call changes nothing and
  returns a summary and a code. Only a second call with that code, within 10 minutes,
  from the same assistant, does it, and it does what was summarised (the arguments are
  stored with the code, not resent).
- **Limits per assistant:** 60 calls a minute, 20 changes a minute, 10 deletes or price
  changes an hour.
- **A log** of every call in Admin > Integrations (90 days).
- **Buyer text is data.** Names, notes and reviews come back labelled
  `untrusted_buyer_text`, and Claude is told never to follow instructions in them. Do not
  turn on email or web-browsing connectors in the same chat.
- Order totals cannot be written at all: the database computes them.

Details: [DATABASE.md](DATABASE.md) (AI assistant), [DECISIONS.md](DECISIONS.md) 13 and 14.

## Known limits

- Supabase's OAuth server is in **beta**.
- Supabase tokens always say `aud = "authenticated"` and Supabase does not take the
  `resource` parameter, so the server cannot prove a token was minted for `/mcp` as the
  MCP specification asks. The allow-list in the database is the substitute.
- An assistant approved before the database update must be allowed once on the
  Integrations page.
- ChatGPT is not supported yet (see LATER.md).

## Where the code is

`src/routes/mcp.ts` and `src/lib/server/mcp/` (server, sign-in check, tools in
`tools/`, every tool through `defineTool` in `tools/define.ts`);
`src/routes/[.]well-known.oauth-protected-resource.mcp.ts`; `src/routes/oauth.consent.tsx`;
`src/routes/admin.integrations.tsx`; `src/routes/admin.upload.$code.tsx`;
`src/routes/api.ai-drive.ts` and `src/lib/server/drive*.ts`; `supabase/schema.sql`
section 13 plus `ai_connections` (section 2) and `has_admin_role` (section 4).

A new tool must use `defineTool`, and a new delete or price change must be
`destructive` (`tools/catalogue.test.ts` checks).

## Sources (checked 2026-11-14)

- MCP specification, current revision 2026-07-28:
  https://modelcontextprotocol.io/specification/versioning ,
  https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization
- Supabase OAuth 2.1 server (beta, all plans; Authorization Path; Site URL):
  https://supabase.com/docs/guides/auth/oauth-server/getting-started ,
  https://supabase.com/docs/guides/auth/oauth-server/mcp-authentication
- `getClaims` verifies locally with asymmetric keys and asks the Auth server otherwise,
  so older projects on the legacy secret work too:
  https://supabase.com/docs/reference/javascript/auth-getclaims
- Claude custom connectors: https://claude.com/docs/connectors/custom/add-unlisted ,
  https://support.claude.com/en/articles/11175166-getting-started-with-custom-connectors-using-remote-mcp
- SDK: `@modelcontextprotocol/server` 2.4.0 (Apache-2.0), npm, published 2026-10-23.
