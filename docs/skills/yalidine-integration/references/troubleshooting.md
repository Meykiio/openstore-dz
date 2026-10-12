# Troubleshooting

Common failure modes when integrating, and what they actually mean.

## API errors

| Symptom | Likely cause | Fix |
|---|---|---|
| `401`/`403` on every call | Missing or wrong `X-API-ID`/`X-API-TOKEN` header, or credentials expired (365-day expiry) | Check env vars are actually loaded server-side; ask the user to check the Développement page for expiry/regenerate |
| `429 Too many requests` | Rate limit hit (5/s, 50/min, 1000/hr, 10000/day by default) | Read `Retry-After` header and back off; check you're not re-fetching wilayas/communes/centers on every request instead of caching them |
| Parcel creation returns `success: false` for one entry, others succeed | Normal batch behavior — one bad row doesn't fail the batch | Check that entry's `message` field, fix that specific row, don't retry the whole batch |
| `"to_commune_name"`/`"to_wilaya_name"` rejected | Name doesn't exactly match the wilayas/communes endpoint (accents, spelling, stale cache) | Validate against your cached list before sending, refresh the cache, compare byte-for-byte including accents |
| `PATCH`/`DELETE` fails on a parcel that looks fine | `last_status` is no longer "En préparation" — Yalidine already picked it up | Surface this as an expected UI state ("can no longer be edited"), not a bug |
| `stopdesk_id` rejected | ID doesn't belong to the destination commune/wilaya, or wasn't looked up from `/v1/centers` | Re-fetch centers filtered by the destination and let the user pick from real options |
| Personal data looks like `"M*****d"` after saving | You wrote a masked GET/PATCH response back into your own DB | Only trust unmasked data from the original POST (creation) response; never overwrite good data with a later masked read |

## Webhook issues

| Symptom | Likely cause | Fix |
|---|---|---|
| Webhook creation fails in the dashboard | Endpoint isn't deployed yet, or doesn't answer the CRC challenge correctly | Confirm the endpoint is live and test the CRC check yourself first: `curl "https://your-url?subscribe=1&crc_token=test123"` should return exactly `test123` with a 200 |
| Webhook silently stopped delivering | CRC re-validation failed at some point (endpoint was down, redeployed without the CRC handler, etc.), or the retry policy exhausted after ~40 hours of failures | The CRC check must be permanent code, not something removed after initial setup; ask the user to check the dashboard's log/status and re-enable if disabled |
| Getting `400`s back for legitimate deliveries | Signature verification comparing against parsed/re-serialized JSON instead of the **raw** request body | HMAC must be computed over the exact raw bytes received — parsing then re-stringifying JSON can change whitespace/key order and break the match |
| Same event processed twice | Expected — Yalidine can redeliver, and events aren't guaranteed in order | Dedupe on `event_id` (e.g. a unique DB constraint), and order by `occurred_at`, not arrival time |
| Endpoint works locally but the dashboard can't validate it | URL isn't publicly reachable, isn't HTTPS, or is behind auth/a firewall | It must be a plain public HTTPS URL Yalidine's servers can reach — no auth in front of it |

## General

- **"It worked with curl but not from my app"** — usually a header casing/encoding issue, or the app framework stripping/consuming the raw body before your signature check runs (common with body-parsing middleware that runs before your handler — some frameworks need raw-body access explicitly configured).
- **Nothing works and you can't tell why** — check `references/human-only-steps.md`; the fix is very likely something only the account owner can see (dashboard credential state, webhook enabled/disabled, quota).
