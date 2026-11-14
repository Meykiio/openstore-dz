# A Telegram message for every new order

Optional, off by default (0.3.0). Once connected, each new order arrives on your phone
as a Telegram message: the order number, the buyer's name and phone, the wilaya and
commune, home or carrier office, the items, the total, the note, and a link to your
dashboard. Free, instant, no business account. Built and run first on JOAT-store.

## Set it up (about three minutes, once)

You need the owner account (staff cannot connect a bot).

1. **Update the database** if your dashboard asks ([UPDATING.md](../UPDATING.md), step D).
2. In Telegram, open **@BotFather**, send `/newbot`, choose a name and a username
   ending in `bot`. BotFather answers with a **token** like `123456789:AA...`.
3. In your shop: **Admin > Integrations > Telegram notifications**. Paste the token and
   tap **Check**.
4. Tap the **Start** link it shows. Telegram opens your bot; press **Start**.
   Already pressed Start before? Send the code shown on the card to the bot as a
   normal message instead.
5. Back in the dashboard, tap **Connect**. The bot sends a first message.

The messages are written in the language your dashboard was in when you connected
(Arabic, French or English). Change it any time on the card. You can switch the
messages off, send a test, or disconnect from the same card.

## Good to know

- Messages include the buyer's name and phone. Do not add the bot to a group, and keep
  the token to yourself. If it leaks, open @BotFather, `/revoke`, and connect again.
- The token is stored in the database, in a table no browser and no AI assistant can
  read. It is never shown again after you connect.
- The database sends the message after the order is saved (with `pg_net`), so a slow
  or broken Telegram can never delay or lose an order.
- Test orders named `E2E-TEST` (the automated buyer journey) are not sent.
- Connecting reads the bot's recent messages with `getUpdates`, which does not work if
  the bot has a webhook. A new bot has none.

Details: [DATABASE.md](DATABASE.md) (Telegram), [DECISIONS.md](DECISIONS.md) 15.

## Where the code is

`supabase/schema.sql` section 14; `src/lib/server/telegram*.ts` and
`src/routes/api.telegram.ts` (connecting); `src/components/admin/telegram-*.tsx`;
`src/lib/admin-telegram.ts`; `src/lib/locales/*.telegram.ts`.

## Sources (checked 2026-11-14)

- `getUpdates`: unread updates are kept up to 24 hours; an update is confirmed by a
  later `offset`; it does not work while a webhook is set:
  https://core.telegram.org/bots/api#getupdates
- Deep links: the start parameter is up to 64 characters of `A-Z a-z 0-9 _ -`:
  https://core.telegram.org/bots/features#deep-linking
