---
name: yalidine-integration
description: Integrate the Yalidine (Guepex) Algerian delivery/courier API and webhooks into any codebase — creating and tracking parcels, looking up wilayas/communes/stop-desk centers, calculating delivery fees, and receiving real-time delivery-status webhooks. Use this whenever the user asks to integrate Yalidine, Guepex, or an Algerian shipping/courier API, add cash-on-delivery parcel creation, stop-desk/home delivery, parcel tracking, or delivery-status webhooks to their app — even if they just say "add Yalidine" or "hook up shipping" without more detail.
---

# Yalidine (Guepex) Delivery Integration

Yalidine is Algeria's largest courier network. Its API is exposed under the
brand name **Guepex** (base URL `api.guepex.app`, dashboard `guepex.app`) —
same company, same API, same webhooks. Treat "Yalidine" and "Guepex" as the
same integration.

This skill gives a coding agent everything needed to wire a platform up to
Yalidine end-to-end: creating parcels, looking up delivery zones, calculating
fees, and reacting to delivery-status changes via webhooks — without ever
needing to see the user's real API credentials.

## Before you write any code

Read the reference file(s) that match what you're building. Don't load both
up front if the task only needs one — this keeps context lean.

- **references/api-reference.md** — every REST endpoint (parcels, wilayas,
  communes, centers, fees, histories): params, filters, fields, full request
  and response shapes.
- **references/webhooks-reference.md** — event types, payload formats, CRC
  challenge validation, HMAC signature verification, retry policy.
- **references/human-only-steps.md** — the dashboard actions only the
  account owner can do. Read this first if the user hasn't mentioned having
  credentials yet.
- **references/troubleshooting.md** — check here before improvising a fix
  when a call fails, a webhook doesn't fire, or a signature check rejects a
  real delivery. Most "weird" failures map to a known cause.

`assets/.env.example` — copy this into the project as a starting point for
the required environment variables.

Two ready-to-adapt implementations are in `scripts/`:
- `scripts/yalidine-client.ts` — typed API client (fetch-based, no
  dependencies) covering all endpoints, pagination, and rate-limit headers.
- `scripts/webhook-handler.ts` — a Supabase Edge Function (Deno) implementing
  CRC validation + signature verification + event routing. Adapt the
  request/response wrapper for Express/Next.js/etc. if the project isn't on
  Supabase — the validation and security logic underneath is identical.

## The integration workflow

1. **Confirm the user has generated credentials.** You cannot get an API ID,
   API TOKEN, or webhook secret key yourself — these only exist inside the
   user's own Guepex Developer Dashboard and Webhooks Dashboard. If they
   haven't mentioned having them, point them to `references/human-only-steps.md`
   and wait. Never ask them to paste a screenshot of their dashboard or the
   raw key values into chat — have them put the values straight into an env
   file instead (see Security below).

2. **Set up configuration**, not hardcoded values:
   ```
   YALIDINE_API_ID=...
   YALIDINE_API_TOKEN=...
   YALIDINE_BASE_URL=https://api.guepex.app/v1/
   YALIDINE_WEBHOOK_SECRET=...   # only needed if implementing webhooks
   ```
   Add these to `.env.example` with empty values so the user knows what to
   fill in, and to the project's actual env file (gitignored) if the user
   gives you the real values directly (not via screenshot).

3. **Build the API client layer first** using
   `references/api-reference.md` — start with whichever endpoints the
   feature needs (usually: wilayas/communes for address forms, fees for a
   checkout price preview, parcels for order creation, histories for
   tracking pages).

4. **Cache static lookup data.** Wilayas, communes, and centers change
   rarely. Don't call these endpoints on every request — fetch once, store
   in the app's DB or a cache with a daily/weekly refresh, and read from
   there. This also protects the user's rate-limit quota (see below).

5. **Build the webhook endpoint last**, once parcel creation works, using
   `references/webhooks-reference.md`. The endpoint must exist and pass CRC
   validation *before* the user can create the webhook in their dashboard —
   tell them the order of operations if they ask you to "just set up the
   webhook."

6. **Tell the user what to do in the dashboard** once your code is ready —
   see `references/human-only-steps.md` for the exact list, in order.

## Non-negotiable security rules

- **Never** put `YALIDINE_API_TOKEN` in front-end/client-side code (browser
  JS, mobile app bundles). It's a backend-only secret — every Yalidine call
  must go through the user's own server or edge function, never directly
  from a browser.
- **Always** verify the `X-YALIDINE-SIGNATURE` header (HMAC-SHA256 of the
  raw request body, keyed with the webhook secret) before trusting any
  webhook payload. Reject anything that doesn't match with a 400 — see
  `references/webhooks-reference.md` for the exact algorithm.
- **Always** keep the CRC challenge-response check (`?subscribe=...&crc_token=...`
  → echo `crc_token` back, 200 status) live in the webhook endpoint
  permanently. Yalidine re-validates it periodically; if it ever fails, the
  webhook is auto-disabled and the user stops getting delivery updates
  silently.
- **Never** write real API IDs, tokens, secret keys, webhook URLs, or alert
  emails into code comments, example files, or documentation you generate —
  use env var references only, even in "here's an example" snippets.
- The webhook endpoint must respond within 10 seconds. If the user's
  business logic (sending SMS, updating other systems, etc.) might be slow,
  have the endpoint just persist the raw payload and return 200 immediately,
  then process it in a background job/queue.

## Key domain gotchas (read before generating parcel-creation code)

- **Addresses are matched by name, not ID, when creating/editing a parcel.**
  `from_wilaya_name` and `to_wilaya_name`/`to_commune_name` must exactly
  match a name from the wilayas/communes endpoints. Validate against your
  cached list before sending — a typo fails the whole parcel.
- **Personal data comes back masked** (`firstname`, `familyname`,
  `contact_phone`, `address`, and the phone segment of `qr_text`) on every
  GET and PATCH response — e.g. `"M*****d"`. This is intentional privacy
  protection on Yalidine's side. Never overwrite your own stored values with
  these masked ones. POST (creation) responses are not masked.
- **Stop-desk deliveries require a real `stopdesk_id`.** Look it up from the
  `centers` endpoint (filter by `wilaya_id`/`commune_id`) — don't let a user
  type one in freely.
- **Edit and delete only work while the parcel's `last_status` is "En
  préparation."** Once Yalidine picks it up, both `PATCH` and `DELETE` fail.
  Surface this constraint in the UI rather than letting users hit an API
  error.
- **Exchange parcels**: if `has_exchange` is `true`, `product_to_collect` is
  required.
- **Oversize fee** applies past 5kg billable weight, where billable weight =
  `max(actual_weight, length*width*height*0.0002)`. Formula and worked
  examples are in `references/api-reference.md` under Fees.
- **Rate limits** (default): 5/sec, 50/min, 1000/hour, 10000/day. Every
  response includes `x-second-quota-left`, `x-minute-quota-left`,
  `x-hour-quota-left`, `x-day-quota-left` headers — read them, and back off
  before hitting 429. Repeated 429s extend the ban period.
- **Bulk creation**: `POST /v1/parcels` takes an *array* of parcels, even
  for one. The response is keyed by `order_id`, and partial failure is
  normal — some parcels in a batch can fail while others succeed. Always
  check each entry's `success` field individually rather than assuming an
  all-or-nothing result.

## If something looks like it needs a dashboard action mid-build

Stop and tell the user — don't guess or fabricate a credential/URL/ID to
keep going. Point them at `references/human-only-steps.md`.

## If a call or a webhook doesn't behave as expected

Check `references/troubleshooting.md` before improvising — most failures
(401s, rejected commune names, signature mismatches, silently-stopped
webhooks) have a known cause and fix there rather than needing a guess.

## Definition of done — verify before calling the integration finished

Don't declare the integration complete on "the code compiles." Actually
run these checks, and tell the user which ones you could/couldn't verify
yourself (some need their real credentials or a live deployment):

- [ ] A real call to `GET /v1/wilayas` succeeds with the user's credentials
      (proves auth is wired correctly).
- [ ] Wilaya/commune names used in parcel creation are validated against a
      cached lookup, not typed freely.
- [ ] Stop-desk flows resolve `stopdesk_id` from `/v1/centers`, never from
      free user input.
- [ ] Parcel creation handles **partial batch failure** — each entry's
      `success` field is checked individually, not just the HTTP status.
- [ ] The API token/ID never appear in any client-side/browser-reachable
      code path — grep the frontend bundle for the env var names if unsure.
- [ ] If webhooks are in scope: the CRC endpoint returns the exact token
      for a manual `curl "<url>?subscribe=1&crc_token=test123"` check, and
      this logic has no code path that could ever be removed by mistake.
- [ ] If webhooks are in scope: signature verification uses the **raw**
      request body, not re-serialized JSON, and rejects on mismatch.
- [ ] If webhooks are in scope: the endpoint returns `200` well under 10
      seconds even under real processing load (heavy logic deferred to a
      queue/background job).
- [ ] Event `event_id` values are deduplicated before side effects run
      (e.g. don't send a "your parcel shipped" SMS twice for a retried
      delivery).
