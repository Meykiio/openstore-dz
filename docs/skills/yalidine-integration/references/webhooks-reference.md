# Yalidine (Guepex) Webhooks Reference

Webhooks push delivery-status changes to your endpoint in near real-time,
so you don't have to poll `GET /v1/parcels` or `GET /v1/histories`
repeatedly (which also burns your rate-limit quota).

## What your endpoint must do, always

1. Be a public **HTTPS** URL.
2. **Answer the CRC challenge** — Yalidine periodically sends
   `GET <your-url>?subscribe=1&crc_token=<token>` to prove you own the URL.
   You must respond `200` within 10 seconds with the exact `crc_token` value
   echoed back as the body, in plain text. **This check must stay in the
   code permanently** — Yalidine re-validates on webhook creation, on edit,
   and periodically afterward. If it ever fails, the webhook is silently
   disabled and delivery notifications stop.
3. **Verify the signature** on every actual event delivery (see below)
   before trusting the payload.
4. **Respond `200` within 10 seconds** to event deliveries. If your
   business logic is slow (sending SMS, hitting another API, etc.), persist
   the raw payload first and process it asynchronously — don't make
   Yalidine wait on your downstream work.

## Event types

| Event | Fires when |
|---|---|
| `parcel_created` | one or more parcels created (via dashboard import or API) |
| `parcel_edited` | a parcel is edited |
| `parcel_deleted` | a parcel is deleted |
| `parcel_status_updated` | delivery status changes (the useful one for tracking UIs) |
| `parcel_payment_updated` | COD payment status changes |

## Payload shape

Every delivery is `POST`ed as JSON, always **one event type per request**,
but can bundle **multiple events of that type** in one delivery:

```json
{
  "type": "parcel_status_updated",
  "events": [
    {
      "event_id": "WN3BkDcpPyjhb6MCJQ2VoKz7vT8l5g1a",
      "occurred_at": "2022-04-28 00:01:26",
      "data": { "tracking": "yal-111AAA", "status": "Sorti en livraison", "reason": null }
    },
    {
      "event_id": "D5eoH7hmy8NWapJCAs6xER2vMfd0TQti",
      "occurred_at": "2022-04-28 12:01:26",
      "data": { "tracking": "yal-222BBB", "status": "Tentative échouée", "reason": "Client ne répond pas" }
    }
  ]
}
```

- **`event_id`** — dedupe key. The same event can arrive more than once
  (retries, redeliveries); log processed `event_id`s and skip repeats.
- **`occurred_at`** — use this for ordering, not arrival time. **Events are
  not guaranteed to arrive in order.**
- **`data`** — shape depends on `type`:

| type | `data` fields |
|---|---|
| `parcel_created` | `order_id`, `tracking`, `label`, `import_id` |
| `parcel_edited` | `tracking`, `label` |
| `parcel_deleted` | `tracking` |
| `parcel_status_updated` | `tracking`, `status`, `reason` (nullable) |
| `parcel_payment_updated` | `tracking`, `status` (`not-ready`\|`ready`\|`receivable`\|`payed`), `payment_id` (nullable) |

New fields may be added to `data` without notice — parse defensively
(ignore unknown keys, don't assume an exhaustive field list), and don't
break if a field you don't use is missing.

## Signature verification

Every delivery includes an `X-YALIDINE-SIGNATURE` header:
```
signature = HMAC_SHA256(raw_request_body, webhook_secret_key)
```
Compute the same HMAC over the **raw** (unparsed) request body using the
webhook's secret key (from the Webhooks Dashboard — see
`human-only-steps.md`), and compare. If they don't match, or the header is
missing, reject with `400` and do not process the payload.

Use a constant-time comparison, not `===`/`==`, to avoid timing attacks —
see `scripts/webhook-handler.ts` for a working implementation.

## Retry policy

If your endpoint doesn't return `200` in 10 seconds, Yalidine retries with
exponential backoff, 7 attempts total, over ~40 hours:

| Attempt | Delay after previous attempt |
|---|---|
| 1 | immediately |
| 2 | 5 minutes |
| 3 | 15 minutes |
| 4 | 1 hour |
| 5 | 3 hours |
| 6 | 12 hours |
| 7 | 1 day |

After attempt 7 fails, the event is dropped. After several consecutive
failed days, Yalidine emails the account's alert address and **auto-disables
the webhook**. If that happens, someone has to go re-enable it manually in
the dashboard after fixing the endpoint — this can't be done via the API.

## Dashboard-side lifecycle (for context — these are human-only actions)

Creating, editing, testing, enabling/disabling, and viewing logs for a
webhook all happen in the Webhooks Dashboard, not the API. See
`human-only-steps.md` for the exact sequence to give the user. Two things
worth knowing while you build the endpoint:

- A newly created webhook starts **disabled**. The user must explicitly
  enable it after testing.
- The dashboard has a built-in "send a test event" button per subscribed
  event type — tell the user to use it once your endpoint is deployed,
  before enabling the webhook for real traffic.
- Logs are kept for 48 hours and are only visible in the dashboard — you
  can't fetch webhook delivery logs via the API, so if debugging a
  suspected delivery issue, ask the user to check the dashboard's log
  button rather than trying to reproduce it purely from your own server
  logs.
