# Sending orders to Google Sheets

Optional. Off by default, and nothing about checkout depends on it: the export runs
in a database trigger that queues an asynchronous request after the order commits,
so a slow or broken endpoint can never delay or fail an order.

You can have as many destinations as you like. Each one gets its own secret and its
own signature, so revoking one does not affect the others.

---

## What you need

- A Google account.
- The shop running, with you signed in as the owner.
- About five minutes.

---

## Step 1. Create the sheet and the script

1. Create a new Google Sheet. Name it whatever you like.
2. In the sheet, open **Extensions → Apps Script**.
3. Delete whatever is in `Code.gs` and paste the script from
   [Step 5](#step-5-the-script) below.
4. Leave `SECRET` as it is for now. You will paste the real value in Step 3.

## Step 2. Deploy it as a web app

1. In the Apps Script editor, click **Deploy → New deployment**.
2. Click the gear next to **Select type** and choose **Web app**.
3. Set **Execute as** to **Me**.
4. Set **Who has access** to **Anyone**.

   This is not optional and it is not a hole. The endpoint has to be reachable for
   the shop to post to it. What protects it is the signature: every request is
   signed, and the script rejects anything whose signature does not match. The
   secret never travels in the URL. Without the signature this step really would be
   a hole, which is why the secret is required before a destination can be added.

5. Click **Deploy**, authorise the script when Google asks, and copy the **Web app
   URL**. It looks like
   `https://script.google.com/macros/s/AKfy…/exec`.

## Step 3. Add the destination in the shop

1. In the shop, go to **Settings → Order export**.
2. Give it a name, paste the Web app URL, and add it.
3. The shop generates a secret. Copy it.

## Step 4. Paste the secret into the script

Back in the Apps Script editor, replace the `SECRET` line, then
**Deploy → Manage deployments → Edit → Version: New version → Deploy**. Editing the
code without redeploying leaves the old version serving requests, which is the most
common reason a correctly configured export appears to do nothing.

---

## Step 5. The script

```javascript
/**
 * OpenStore DZ order receiver.
 *
 * Writes each order into this spreadsheet, upserting on the order id so that a
 * status change updates the existing row rather than adding a duplicate.
 */

// 1. Paste the secret from Settings -> Order export here.
const SECRET = "PASTE_YOUR_SECRET_HERE";

// 2. The tab orders are written to. Created if it does not exist.
const SHEET_NAME = "Orders";

const COLUMNS = [
  "order_id",
  "event",
  "status",
  "created_at",
  "customer_name",
  "phone",
  "wilaya",
  "commune",
  "address",
  "note",
  "items",
  "subtotal",
  "delivery_fee",
  "total",
  "tracking_number",
  "tracking_url",
];

function doPost(e) {
  const body = e.postData.contents;

  // The shop cannot put the signature in a header, because Apps Script does not
  // expose request headers at all. It arrives as a query parameter instead.
  if (!verify(body, e.parameter.sig)) {
    return respond({ ok: false, error: "bad signature" });
  }

  const payload = JSON.parse(body);
  const sheet = sheetFor();
  const row = rowFrom(payload);
  const id = payload.order.id;

  const ids = sheet
    .getRange(2, 1, Math.max(sheet.getLastRow() - 1, 0), 1)
    .getValues()
    .map(function (r) {
      return r[0];
    });
  const at = ids.indexOf(id);

  if (at === -1) {
    sheet.appendRow(row);
  } else {
    sheet.getRange(at + 2, 1, 1, row.length).setValues([row]);
  }

  return respond({ ok: true, event: payload.event });
}

/** HMAC-SHA256 over the raw body, hex encoded. Must match the database exactly. */
function verify(body, signature) {
  if (!signature) return false;
  const raw = Utilities.computeHmacSha256Signature(body, SECRET);
  const expected = raw
    .map(function (b) {
      return ((b & 0xff) + 0x100).toString(16).slice(1);
    })
    .join("");
  // A plain comparison, not a constant-time one. Apps Script has no primitive for
  // that, and the attack it defends against needs thousands of timed requests
  // against an endpoint that logs nothing, which is not the threat here.
  return expected === signature;
}

function sheetFor() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = book.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = book.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMNS);
    sheet.getRange(1, 1, 1, COLUMNS.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function rowFrom(payload) {
  const order = payload.order;
  const items = (payload.items || [])
    .map(function (i) {
      return (
        i.quantity + " x " + i.product_name + (i.variant_label ? " (" + i.variant_label + ")" : "")
      );
    })
    .join(" | ");

  return [
    order.id,
    payload.event,
    order.status,
    order.created_at,
    order.customer_name,
    order.phone,
    order.wilaya,
    order.commune,
    order.address,
    order.note,
    items,
    order.subtotal,
    order.delivery_fee,
    order.total,
    order.tracking_number,
    order.tracking_url,
  ].map(asText);
}

// A buyer types their own name and note. Text starting with = + - @ would run as
// a formula in the sheet (a fake order named =IMPORTXML(...) could leak the sheet),
// so it is written with a leading apostrophe, which keeps it plain text.
function asText(value) {
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(value)) return "'" + value;
  return value;
}

function respond(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
```

---

## What gets sent

A POST with a JSON body:

```json
{
  "event": "created",
  "sent_at": "2026-10-14T15:02:19Z",
  "shop": { "name": "My shop", "phone": "+213 555 00 00 00", "whatsapp": "+213 555 00 00 00" },
  "order": {
    "id": "5d151305-…",
    "token": "…",
    "customer_name": "…",
    "phone": "0555123456",
    "wilaya": "Alger",
    "commune": "Bab El Oued",
    "address": "…",
    "note": null,
    "subtotal": 5000,
    "delivery_fee": 600,
    "total": 5600,
    "status": "pending",
    "created_at": "…",
    "confirmed_at": null,
    "refused_at": null,
    "refused_reason": null,
    "shipped_at": null,
    "delivered_at": null,
    "carrier": null,
    "tracking_number": null,
    "tracking_url": null
  },
  "items": [
    {
      "product_name": "…",
      "variant_label": "M / Red",
      "quantity": 1,
      "unit_price": 5000,
      "line_total": 5000
    }
  ]
}
```

`event` is `created` for a new order and `status_changed` for any later status
change, so a confirmed or refused order updates its existing row rather than
appearing twice.

**If your sheet already has data, delete it first.** The script assumes row 1 is its
own header row and writes from row 2. An existing header row will be duplicated.

---

## Why the signature is in the URL

Google Apps Script cannot read request headers. The event object it passes to
`doPost()` has no `headers` field and never has (Google issue 67764685, open since
2017). Many webhook providers hit this: ChatWork moved its signature into the query
string for the same reason.

So the signature arrives as `?sig=<hex>` rather than as a header. It is still an
HMAC-SHA256 over the whole request body, keyed with your secret, so it proves the
same thing. The shop also sends the conventional
`X-OpenStore-Signature: sha256=<hex>` header, for any other receiver that can read
one: a make.com scenario, a Zapier webhook, your own server.

---

## Checking it works

Place a test order on your storefront, then look at the **Recent attempts** list
under Settings → Order export. `queued` means the shop handed the request off. It
does not mean the script accepted it, because the request is asynchronous and the
shop does not wait.

If a row does not appear in the sheet:

1. **Did you redeploy after editing the script?** Manage deployments → Edit → New
   version. This is the usual cause.
2. **Is the destination enabled?** The toggle on its card.
3. **Is the secret the current one?** If you removed and re-added the destination,
   the new secret must be pasted in again.
4. **Did the script run at all?** In the Apps Script editor, **Executions** in the
   sidebar lists every invocation and its outcome.
5. **For anything else**, the raw delivery outcome is in the database:
   ```sql
   select id, status_code, timed_out, error_msg, created
   from net._http_response order by created desc limit 10;
   ```
   Note that this table is pruned after six hours.
