/**
 * Yalidine (Guepex) webhook endpoint — Supabase Edge Function (Deno).
 *
 * Deploy as e.g. `supabase/functions/yalidine-webhook/index.ts`, then give
 * its public URL to the user to paste into the Webhooks Dashboard (see
 * references/human-only-steps.md).
 *
 * Handles both required behaviors:
 *  1. CRC challenge-response (GET ?subscribe=1&crc_token=...) — must stay
 *     live forever, Yalidine re-validates periodically.
 *  2. Signature-verified event delivery (POST) — HMAC-SHA256 of the raw
 *     body, keyed with the webhook secret, compared in constant time.
 *
 * Adapting to Express/Next.js/etc.: keep the two functions
 * (verifySignature, handleCrcChallenge) as-is — they're framework-agnostic
 * logic. Just swap the Deno.serve request/response plumbing for your
 * framework's equivalent (req.query, req.headers, res.status().send()...).
 */

const WEBHOOK_SECRET = Deno.env.get("YALIDINE_WEBHOOK_SECRET") ?? "";

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);

  // --- 1. CRC challenge-response check (GET) ---
  // This must always be present. If it ever stops responding correctly,
  // Yalidine disables the webhook silently.
  if (req.method === "GET") {
    const subscribe = url.searchParams.get("subscribe");
    const crcToken = url.searchParams.get("crc_token");
    if (subscribe !== null && crcToken !== null) {
      return new Response(crcToken, { status: 200 });
    }
    return new Response("Missing subscribe/crc_token", { status: 400 });
  }

  // --- 2. Event delivery (POST) ---
  if (req.method === "POST") {
    const rawBody = await req.text(); // must verify against the RAW body, not parsed JSON
    const signature = req.headers.get("x-yalidine-signature");

    if (!signature) {
      return new Response("Missing signature", { status: 400 });
    }

    const isValid = await verifySignature(rawBody, signature, WEBHOOK_SECRET);
    if (!isValid) {
      return new Response("Invalid signature", { status: 400 });
    }

    let payload: YalidineWebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    // Respond fast: persist raw payload, process async. Don't do slow work
    // (SMS, third-party API calls, etc.) before returning 200 — you have
    // 10 seconds total before Yalidine considers this delivery failed.
    await queueForProcessing(payload);

    return new Response("OK", { status: 200 });
  }

  return new Response("Method not allowed", { status: 405 });
});

interface YalidineWebhookEvent {
  event_id: string;
  occurred_at: string;
  data: Record<string, unknown>;
}

interface YalidineWebhookPayload {
  type:
    | "parcel_created"
    | "parcel_edited"
    | "parcel_deleted"
    | "parcel_status_updated"
    | "parcel_payment_updated";
  events: YalidineWebhookEvent[];
}

/** HMAC-SHA256(rawBody, secret) compared to the signature header, constant-time. */
async function verifySignature(
  rawBody: string,
  signatureHeader: string,
  secret: string
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(rawBody)
  );
  const computedHex = bufferToHex(signatureBuffer);
  return timingSafeEqual(computedHex, signatureHeader);
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Persist the payload for background processing — e.g. insert into a
 * Supabase table and let a separate function/cron consume it. Replace with
 * your actual queue/table. Keeping this fast is what keeps you inside the
 * 10-second response window.
 */
async function queueForProcessing(payload: YalidineWebhookPayload): Promise<void> {
  // Example (uncomment and adapt once a Supabase client + table exist):
  //
  // await supabase.from("yalidine_webhook_events").insert(
  //   payload.events.map((event) => ({
  //     event_id: event.event_id,      // unique constraint on this column dedupes retries
  //     type: payload.type,
  //     occurred_at: event.occurred_at,
  //     data: event.data,
  //   }))
  // );

  console.log(`Received ${payload.events.length} ${payload.type} event(s)`);
}
