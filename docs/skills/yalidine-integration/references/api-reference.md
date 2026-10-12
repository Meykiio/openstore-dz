# Yalidine (Guepex) API Reference

Base URL: `https://api.guepex.app/v1/`

Every request needs two headers:
```
X-API-ID: <YALIDINE_API_ID>
X-API-TOKEN: <YALIDINE_API_TOKEN>
```

These are backend-only secrets, generated in the user's own Developer
Dashboard (see `human-only-steps.md`). Never hardcode real values — use env
vars, and use placeholders like `YOUR_API_ID` in any example code you write.

Sanity check while wiring things up:
```bash
curl "https://api.guepex.app/v1/wilayas/" \
  -H "X-API-ID: $YALIDINE_API_ID" \
  -H "X-API-TOKEN: $YALIDINE_API_TOKEN"
```
A working call returns the wilayas list as JSON.

## Table of contents
- [Pagination & list responses](#pagination--list-responses)
- [Filtering, fields, ordering (shared conventions)](#filtering-fields-ordering-shared-conventions)
- [Rate limits](#rate-limits)
- [Wilayas](#wilayas)
- [Communes](#communes)
- [Centers (stop-desks)](#centers-stop-desks)
- [Fees](#fees)
- [Parcels](#parcels)
- [Histories (tracking events)](#histories-tracking-events)

---

## Pagination & list responses

Every list endpoint accepts:
| Param | Type | Description |
|---|---|---|
| `page` | int | page number (optional) |
| `page_size` | int | 1–1000, default 100 |

Response shape:
```json
{
  "has_more": true,
  "total_data": 58,
  "data": [ /* array of objects */ ],
  "links": {
    "self": "https://api.guepex.app/v1/wilayas/?page_size=3&page=2",
    "before": "https://api.guepex.app/v1/wilayas/?page_size=3&page=1",
    "next": "https://api.guepex.app/v1/wilayas/?page_size=3&page=3"
  }
}
```
Follow `links.next` until it's absent (or `has_more` is `false`) to page
through a full dataset.

## Filtering, fields, ordering (shared conventions)

These apply the same way across wilayas, communes, centers, parcels, and
histories:

- **Filters** are query params, e.g. `?wilaya_id=16`. Multiple values for the
  same filter: comma-separate them, e.g. `?wilaya_id=16,19,6`. Exception:
  date filters only take one value or a `from,to` pair, never a list.
  - Date range example: `?date_creation=2020-06-01,2020-07-01`
- **`fields`**: comma-separated list of fields to return instead of the
  default set, e.g. `?fields=id,name`.
- **`order_by`**: pass one of the sortable field names for that endpoint.
  Add `&desc` or `&asc` (no value) to set direction.
- Look a single record up by ID/tracking in the path (`/v1/wilayas/15`) or
  via the ID/tracking filter for several at once
  (`/v1/wilayas/?id=15,16,5`).

## Rate limits

Default quotas — per API account:

| Window | Default limit | Resets |
|---|---|---|
| second | 5 | 1s after your first request in the window |
| minute | 50 | 60s after your first request |
| hour | 1000 | 1h after your first request |
| day | 10000 | 24h after your first request |

Every response includes headers showing what's left:
`x-second-quota-left`, `x-minute-quota-left`, `x-hour-quota-left`,
`x-day-quota-left`. Read these in your client and back off proactively.

Exceeding a limit returns `429 Too many requests` with a `Retry-After`
header (seconds to wait). Repeated violations extend the lockout period —
build retry/backoff logic, don't just hammer it again immediately.

---

## Wilayas

Algeria's 58 provinces (top-level delivery zones).

`GET /v1/wilayas` · `GET /v1/wilayas/:id`

**Filters**: `id`, `name`, `fields`, `page`, `page_size`, `order_by` (`id`|`name`), `desc`/`asc`

**Fields**: `id` (int), `name` (string), `zone` (int), `is_deliverable` (bool)

```json
{ "id": 16, "name": "Alger", "zone": 1, "is_deliverable": 1 }
```

## Communes

Sub-divisions of a wilaya — the actual delivery destination granularity.

`GET /v1/communes` · `GET /v1/communes/:id`

**Filters**: `id`, `wilaya_id`, `has_stop_desk` (bool), `is_deliverable` (bool), `fields`, `page`, `page_size`, `order_by` (`id`|`wilaya_id`), `desc`/`asc`

**Fields**: `id`, `name`, `wilaya_id`, `wilaya_name`, `has_stop_desk` (bool),
`is_deliverable` (bool), `delivery_time_parcel` (int, days),
`delivery_time_payment` (int, days)

```json
{
  "id": 1630, "name": "Bordj El Kiffan", "wilaya_id": 16, "wilaya_name": "Alger",
  "has_stop_desk": 1, "is_deliverable": 1,
  "delivery_time_parcel": 2, "delivery_time_payment": 5
}
```

`to_commune_name` used when creating a parcel must exactly match a `name`
from this endpoint.

## Centers (stop-desks)

Physical stop-desk locations. Use this to resolve a real `stopdesk_id` for
stop-desk deliveries — never let a user free-type one.

`GET /v1/centers` · `GET /v1/centers/:center_id`

**Filters**: `center_id`, `commune_id`, `commune_name`, `wilaya_id`, `wilaya_name`, `fields`, `page`, `page_size`, `order_by` (`center_id`|`commune_id`|`wilaya_id`), `desc`/`asc`

**Fields**: `center_id`, `name`, `address`, `gps` (`"lat,lng"` string),
`commune_id`, `commune_name`, `wilaya_id`, `wilaya_name`

```json
{
  "center_id": 163001, "name": "Centre de Bordj El Kiffan",
  "address": "...", "gps": "36.72,3.19",
  "commune_id": 1630, "commune_name": "Bordj El Kiffan",
  "wilaya_id": 16, "wilaya_name": "Alger"
}
```

## Fees

Delivery pricing between two wilayas, broken down per destination commune.

`GET /v1/fees/?from_wilaya_id=<id>&to_wilaya_id=<id>` — both params required.

```json
{
  "from_wilaya_name": "Batna",
  "to_wilaya_name": "Adrar",
  "zone": 4,
  "retour_fee": 250,
  "cod_percentage": 0.75,
  "insurance_percentage": 0.75,
  "oversize_fee": 100,
  "per_commune": {
    "101": {
      "commune_id": 101, "commune_name": "Adrar",
      "express_home": 1400, "express_desk": 1100,
      "economic_home": null, "economic_desk": null
    }
  }
}
```

| Field | Description |
|---|---|
| `retour_fee` | Return fee for the zone |
| `cod_percentage` | % fee on cash-on-delivery, applied to `max(price, declared_value)` |
| `insurance_percentage` | % fee for insurance, applied to `max(price, declared_value)` |
| `oversize_fee` | DA charged per KG over the 5KG threshold |
| `express_home` / `express_desk` | delivery fee (DA), taxes included, **excludes** weight/oversize fee |
| `economic_home` / `economic_desk` | same, for economic delivery type if the account has it enabled (`null` if not) |

**Weight/oversize calculation** (needed to get a real total price):
```
volumetric_weight = width_cm * height_cm * length_cm * 0.0002
billable_weight = max(volumetric_weight, actual_weight_kg)
overweight_fee = billable_weight <= 5 ? 0 : (billable_weight - 5) * oversize_fee
total_delivery_fee = base_fee (express_home/desk or economic_home/desk) + overweight_fee
```

---

## Parcels

`GET /v1/parcels` · `GET /v1/parcels/:tracking` · `POST /v1/parcels` ·
`PATCH /v1/parcels/:tracking` · `DELETE /v1/parcels/:tracking`

> Personal data (`firstname`, `familyname`, `contact_phone`, `address`, the
> phone segment of `qr_text`) is **masked** in GET and PATCH responses
> (e.g. `"M*****d"`). Not masked in POST (creation) responses. Never
> overwrite your own DB with masked values.

### Retrieve

`GET /v1/parcels/?tracking=yal-123456,yal-789123` or `GET /v1/parcels/yal-123456`

**Filters**: `tracking`, `order_id`, `import_id`, `to_wilaya_id`,
`to_commune_name`, `is_stopdesk` (bool), `is_exchange` (bool),
`has_exchange` (bool), `economic` (bool), `freeshipping` (bool),
`date_creation` (single date or `from,to`), `date_last_status` (single or
`from,to`), `payment_status` (`not-ready`|`ready`|`receivable`|`payed`),
`last_status` (see status list below), `fields`, `page`, `page_size`,
`order_by` (`date_creation`|`date_last_status`|`tracking`|`order_id`|`import_id`|`to_wilaya_id`|`to_commune_id`|`last_status`), `desc`/`asc`

Full field list on a parcel object:

| Field | Type | Notes |
|---|---|---|
| `tracking` | string | unique ID, e.g. `yal-123456` |
| `order_id` | string | your own order reference |
| `firstname`, `familyname`, `contact_phone`, `address` | string | masked on GET/PATCH |
| `is_stopdesk` | bool | true = stop-desk, false = home delivery |
| `stopdesk_id`, `stopdesk_name` | | when `is_stopdesk` |
| `from_wilaya_id`, `from_wilaya_name` | | sender's wilaya |
| `to_commune_id`, `to_commune_name`, `to_wilaya_id`, `to_wilaya_name` | | destination |
| `product_list` | string | content description |
| `price` | int 0–150000 | amount to collect from receiver |
| `do_insurance` | bool | |
| `declared_value` | int 0–150000 | |
| `delivery_fee` | int | |
| `freeshipping` | bool | true = sender pays delivery fee |
| `import_id` | int | batch-creation id |
| `date_creation`, `date_expedition`, `date_last_status` | datetime string | |
| `last_status` | string | see status list below |
| `taxe_percentage`, `taxe_from`, `taxe_retour` | | COD fee math: `cod_fee = taxe_percentage * price / 100`, applies when `price >= taxe_from` |
| `parcel_type` | `classic`\|`ecommerce`\|`multiseller` | |
| `parcel_sub_type` | `accuse`\|`exchange`\|`rcc`\|`rccback`\|`sm`\|null | |
| `length`, `width`, `height`, `weight` | int | cm / kg |
| `has_recouvrement` | bool | has cash-on-delivery |
| `return_center_code` | string | |
| `current_center_id`, `current_center_name`, `current_wilaya_id`, `current_wilaya_name`, `current_commune_id`, `current_commune_name` | | where the parcel physically is right now |
| `payment_status` | `not-ready`\|`ready`\|`receivable`\|`payed` | |
| `payment_id` | string\|null | |
| `has_exchange` | bool | |
| `product_to_collect` | string\|null | required content when `has_exchange` is true |
| `label` | string | URL to the printable label (bordereau) |
| `labels` | string | URL to all labels from the same creation batch |
| `qr_text` | string | phone segment masked |
| `pin` | string | pin printed on the label |

**Status values (`last_status` / histories `status`)**: Pas encore expédié,
A vérifier, En préparation, Pas encore ramassé, Prêt à expédier, En
passation, Ramassé, Bloqué, Débloqué, Transfert, Expédié, Centre, En
localisation, Vers Wilaya, En transit, Reçu à Wilaya, En attente du client,
Prêt pour livreur, Sorti en livraison, En attente, Annulé, En alerte, Alerte
résolue, Tentative échouée, Livré, Echèc livraison, Retour vers centre,
Retourné au centre, Retour transfert, Retour groupé, Retour à retirer,
Retour non retiré, Colis abandonné, Retour vers vendeur, Retourné au
vendeur, Echange échoué.

### Create

`POST /v1/parcels` with a JSON **array** of parcel objects (even for a
single parcel).

Required fields per parcel: `order_id` (unique per request), `from_wilaya_name`,
`firstname`, `familyname`, `contact_phone` (starts with `0`, 9 digits mobile
or 8 landline; comma-separate for multiple numbers), `address`,
`to_commune_name`, `to_wilaya_name`, `product_list`, `price` (0–150000),
`do_insurance`, `declared_value` (0–150000), `length`, `width`, `height`,
`weight`, `freeshipping`, `is_stopdesk`, `has_exchange`.
Conditional: `stopdesk_id` (required if `is_stopdesk` true),
`product_to_collect` (required if `has_exchange` true). Optional: `economic`.

```json
[
  {
    "order_id": "MyFirstOrder",
    "from_wilaya_name": "Batna",
    "firstname": "Brahim",
    "familyname": "Mohamed",
    "contact_phone": "0123456789",
    "address": "Cité Kaidi",
    "to_commune_name": "Bordj El Kiffan",
    "to_wilaya_name": "Alger",
    "product_list": "Presse à café",
    "price": 3000,
    "do_insurance": true,
    "declared_value": 3500,
    "height": 10, "width": 20, "length": 30, "weight": 6,
    "freeshipping": true,
    "is_stopdesk": true,
    "stopdesk_id": 163001,
    "has_exchange": false,
    "product_to_collect": null
  }
]
```

Response is keyed by `order_id`, and **partial failure is normal** — check
`success` on each entry individually:
```json
{
  "MyFirstOrder": {
    "success": true,
    "order_id": "MyFirstOrder",
    "tracking": "yal-12345A",
    "import_id": 234,
    "label": "https://guepex.app/app/bordereau.php?tracking=yal-12345A&token=...",
    "labels": "https://guepex.app/app/bordereau.php?import_id=352&si=5455878&token=...",
    "message": ""
  }
}
```
A failed entry has `success: false`, `tracking: null`, and a `message`
explaining what was invalid.

### Edit

`PATCH /v1/parcels/:tracking` — **only works while `last_status` is "En
préparation."** Send only the fields you want to change; everything else
stays as-is. Accepts the same field set as creation (all optional here).
Response echoes the updated parcel (with personal data masked again).

### Delete

`DELETE /v1/parcels/:tracking` or `DELETE /v1/parcels/?tracking=a,b,c` —
same "En préparation only" constraint.

```json
[
  { "tracking": "yal-12345A", "deleted": true },
  { "tracking": "yal-99999Z", "deleted": false }
]
```
`deleted: false` means it can't be deleted, was misspelled, doesn't exist,
or was already deleted — no separate error code, check this field.

---

## Histories (tracking events)

Every status change for every parcel — the underlying data behind
`last_status` and behind `parcel_status_updated` webhooks.

`GET /v1/histories` · `GET /v1/histories/:tracking`

**Filters**: `tracking`, `status` (see status list above), `date_status`
(single date or `from,to`), `reason`, `fields`, `page`, `page_size`,
`order_by` (`date_status`|`tracking`|`status`|`reason`), `desc`/`asc`

**Fields**: `date_status`, `tracking`, `status`, `reason`, `center_id`,
`center_name`, `wilaya_id`, `wilaya_name`, `commune_id`, `commune_name`

`reason` is populated for failed-delivery or hold statuses, e.g.:
*Téléphone injoignable, Client ne répond pas, Faux numéro, Client absent
(reporté/échoué), Annulé par le client, Commande double, Le client n'a pas
commandé, Produit erroné/manquant/cassé ou défectueux, Client incapable de
payer, Wilaya/Commune erronée, Client no-show, Adresse non livrable* (failed
delivery) or *Document manquant, Produit interdit/dangereux, Fausse
déclaration* (parcel hold).

Use this endpoint to build a tracking timeline UI, or to backfill history
if you missed webhook events (e.g. after downtime).
