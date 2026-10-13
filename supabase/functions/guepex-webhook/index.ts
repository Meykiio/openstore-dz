/**
 * Guepex webhook — Supabase Edge Function.
 *
 * Deployed with `verify_jwt: false` on purpose. The caller is the carrier, not a
 * Supabase user, so there is no JWT to verify. Authentication is the HMAC-SHA256
 * signature over the raw request body, keyed with GUEPEX_WEBHOOK_SECRET, which
 * is the only thing that proves the request came from the carrier.
 *
 * Two behaviours are required and both are permanent:
 *
 *   GET  ?subscribe=1&crc_token=...   CRC challenge. Must echo the token.
 *        If this ever stops answering, the carrier silently disables the hook.
 *   POST                              Signed events. Verify, store, apply.
 *
 * It stores first and applies second, keyed on the carrier's `event_id`. The
 * carrier retries deliveries, so a plain append would apply a status transition
 * twice; the unique constraint makes the retry a no-op.
 */
import { createClient } from "jsr:@supabase/supabase-js@2";

const SECRET = Deno.env.get("GUEPEX_WEBHOOK_SECRET") ?? "";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } },
);

type WebhookEvent = {
  event_id?: string;
  occurred_at?: string;
  data?: Record<string, unknown>;
};

type WebhookPayload = { type?: string; events?: WebhookEvent[] };

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);

  if (req.method === "GET") {
    const subscribe = url.searchParams.get("subscribe");
    const crcToken = url.searchParams.get("crc_token");
    if (subscribe !== null && crcToken !== null) {
      return new Response(crcToken, { status: 200 });
    }
    return new Response("Missing subscribe/crc_token", { status: 400 });
  }

  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  if (!SECRET) {
    // Refusing is correct: without a secret there is no way to tell the carrier
    // from anyone else who finds this URL.
    return new Response("Webhook secret not configured", { status: 503 });
  }

  // Verify against the RAW body. Reading it as text first is what makes the
  // signature meaningful — a parsed-then-restringified body will not match.
  const rawBody = await req.text();
  const signature =
    req.headers.get("x-yalidine-signature") ?? req.headers.get("x-guepex-signature");

  if (!signature) return new Response("Missing signature", { status: 400 });
  if (!(await verifySignature(rawBody, signature, SECRET))) {
    return new Response("Invalid signature", { status: 400 });
  }

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(rawBody) as WebhookPayload;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const type = payload.type ?? "unknown";
  const events = Array.isArray(payload.events) ? payload.events : [];

  try {
    await handleEvents(type, events);
  } catch (error) {
    // 500 so the carrier retries; the unique constraint makes a retry safe.
    console.error("guepex webhook failed", error);
    return new Response("Processing failed", { status: 500 });
  }

  return new Response("OK", { status: 200 });
});

async function handleEvents(type: string, events: WebhookEvent[]): Promise<void> {
  for (const event of events) {
    const eventId = typeof event.event_id === "string" ? event.event_id : null;
    if (!eventId) continue;

    const { data: inserted, error } = await supabase
      .from("guepex_webhook_events")
      .insert({
        event_id: eventId,
        type,
        occurred_at: event.occurred_at ?? null,
        data: event.data ?? {},
      })
      // Retry of an already-seen event: insert nothing and treat as handled.
      .select("id")
      .maybeSingle();

    if (error) {
      if (String(error.code) === "23505") continue;
      throw error;
    }
    if (!inserted) continue;

    await applyEvent(inserted.id, type, event.data ?? {});
  }
}

/** Update the matching order. Unrecognised statuses leave the order alone. */
async function applyEvent(
  eventRowId: string,
  type: string,
  data: Record<string, unknown>,
): Promise<void> {
  if (type !== "parcel_status_updated" && type !== "parcel_created") return;

  const tracking = str(data.tracking);
  if (!tracking) return;

  const status = mapCarrierStatus(data.last_status ?? data.status);
  const patch: Record<string, unknown> = { tracking_number: tracking };

  if (status) {
    patch.status = status;
    if (status === "delivered") patch.delivered_at = new Date().toISOString();
    if (status === "shipped") patch.shipped_at = new Date().toISOString();
    if (status === "refused") patch.refused_at = new Date().toISOString();
  }

  const { error } = await supabase.from("orders").update(patch).eq("tracking_number", tracking);
  if (error) throw error;

  await supabase
    .from("guepex_webhook_events")
    .update({ processed_at: new Date().toISOString(), note: status ?? "no status mapping" })
    .eq("id", eventRowId);
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function mapCarrierStatus(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.toLowerCase();
  if (s.includes("livr") && !s.includes("non")) return "delivered";
  if (s.includes("retour")) return "returned";
  if (s.includes("annul")) return "cancelled";
  if (s.includes("refus")) return "refused";
  if (s.includes("cours de livraison") || s.includes("expedi") || s.includes("transit")) {
    return "shipped";
  }
  if (s.includes("preparation") || s.includes("préparation") || s.includes("attente")) {
    return "confirmed";
  }
  return null;
}

async function verifySignature(rawBody: string, header: string, secret: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const computed = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return timingSafeEqual(computed, header.toLowerCase());
}

/** Constant-time compare: an early return leaks the matching prefix length. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}
