import "@tanstack/react-start/server-only";
import { createClient } from "@supabase/supabase-js";
import { createGuepexClient, readGuepexConfig, type ParcelInput } from "./guepex";
import { carrierWilaya } from "../wilayas";

/**
 * Carrier work that touches secrets.
 *
 * Marked server-only, and imported ONLY through a dynamic import inside a
 * `createServerFn` handler. That indirection is what keeps the Guepex API token
 * and the Supabase service-role key out of the client bundle: the build fails
 * loudly if this module ever lands on a path from a client component, which is
 * exactly what happened when the marker first sat on the wrapper file instead.
 */

export type CreateParcelResult = { ok: true; tracking: string } | { ok: false; error: string };

function adminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Resolve the caller from their access token and confirm they are an admin. */
async function assertAdmin(accessToken: string): Promise<string | null> {
  const admin = adminClient();
  if (!admin) return "Server is missing SUPABASE_SERVICE_ROLE_KEY.";

  const { data: userData, error: userError } = await admin.auth.getUser(accessToken);
  if (userError || !userData.user) return "Not signed in.";

  const { data: role } = await admin
    .from("admin_users")
    .select("role")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (!role) return "This account is not a shop administrator.";
  return null;
}

/**
 * Create one carrier parcel for an order and store its tracking number.
 *
 * The order is read with the service role, so the address and the value sent to
 * the carrier are the ones in the database — not values a client supplied. The
 * carrier bills on declared value, so a tampered request here is a direct
 * financial loss. Nothing is taken from the input but the order id.
 */
export async function runCreateParcel(input: {
  orderId: string;
  accessToken: string;
}): Promise<CreateParcelResult> {
  const denied = await assertAdmin(input.accessToken);
  if (denied) return { ok: false, error: denied };

  const config = readGuepexConfig();
  if (!config) {
    return {
      ok: false,
      error: "Guepex is not configured. Set GUEPEX_API_ID and GUEPEX_API_TOKEN.",
    };
  }

  const admin = adminClient();
  if (!admin) return { ok: false, error: "Server is missing SUPABASE_SERVICE_ROLE_KEY." };

  const { data: order, error } = await admin
    .from("orders")
    .select(
      "id, customer_name, phone, wilaya, commune, address, total, tracking_number, delivery_method, stopdesk_id, order_items ( product_name, variant_label, quantity )",
    )
    .eq("id", input.orderId)
    .maybeSingle();

  if (error || !order) return { ok: false, error: error?.message ?? "Order not found." };
  if (order.tracking_number) {
    return { ok: false, error: `Already has tracking ${order.tracking_number}.` };
  }
  const pickup = order.delivery_method === "stopdesk";
  if (pickup && !order.stopdesk_id) {
    return {
      ok: false,
      error: "This is a pickup order with no office chosen. Choose the office first.",
    };
  }

  const [firstname, ...rest] = String(order.customer_name).trim().split(/\s+/);

  const parcel: ParcelInput = {
    order_id: order.id,
    firstname: firstname || "Client",
    familyname: rest.join(" ") || "Client",
    contact_phone: String(order.phone),
    address: String(order.address),
    to_wilaya_name: carrierWilaya(String(order.wilaya)),
    to_commune_name: String(order.commune ?? ""),
    // The carrier prints this on the parcel for the courier.
    product_list: (order.order_items ?? [])
      .map((item: { product_name: string; variant_label: string | null; quantity: number }) =>
        [item.product_name, item.variant_label, `x${item.quantity}`].filter(Boolean).join(" "),
      )
      .join(", "),
    price: Number(order.total),
    do_insurance: false,
    declared_value: Number(order.total),
    ...(pickup ? { is_stopdesk: true, stopdesk_id: Number(order.stopdesk_id) } : {}),
  };

  try {
    const client = createGuepexClient(config);
    const response = await client.createParcels([parcel]);
    const result = response[order.id];

    if (!result?.success || !result.tracking) {
      return { ok: false, error: result?.message || "Carrier rejected the parcel." };
    }

    const { error: saveError } = await admin
      .from("orders")
      .update({
        tracking_number: result.tracking,
        carrier: "Guepex",
        status: "shipped",
        shipped_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (saveError) return { ok: false, error: saveError.message };
    return { ok: true, tracking: result.tracking };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Carrier call failed." };
  }
}

export type PickupOffice = { id: number; name: string; address: string; commune: string };

// Offices change rarely and every lookup spends carrier quota, so each server
// instance keeps a wilaya's list for an hour.
const officeCache = new Map<string, { at: number; offices: PickupOffice[] }>();

/**
 * The carrier's pickup offices in a wilaya. Public information, so no admin
 * check: a buyer needs it at checkout. Empty when the carrier is not connected,
 * and the checkout then says the shop will confirm the office by phone.
 */
export async function runListOffices(wilaya: string): Promise<PickupOffice[]> {
  const config = readGuepexConfig();
  if (!config || !wilaya) return [];
  const cached = officeCache.get(wilaya);
  if (cached && Date.now() - cached.at < 3_600_000) return cached.offices;
  try {
    const client = createGuepexClient(config);
    const list = await client.listCenters({ wilaya_name: carrierWilaya(wilaya), page_size: 100 });
    const offices = list.data.map((row) => ({
      id: Number(row.center_id),
      name: String(row.name ?? ""),
      address: String(row.address ?? ""),
      commune: String(row.commune_name ?? ""),
    }));
    officeCache.set(wilaya, { at: Date.now(), offices });
    return offices;
  } catch {
    // A carrier outage must not block checkout; the buyer can still order.
    return [];
  }
}
