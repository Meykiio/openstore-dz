import { getSupabase } from "./supabase/client";
import type { Json } from "./supabase/types";

/**
 * Order placement and tracking.
 *
 * Both go through RPCs rather than table writes. `anon` holds no privileges on
 * `orders` or `order_items`, so these two functions are the only door: one to
 * write an order, one to read it back. Price, product name and variant label are
 * filled server-side from the catalogue, so `OrderLine` carries no money.
 */

export type OrderCustomer = {
  customer_name: string;
  phone: string;
  wilaya: string;
  commune?: string | null;
  address: string;
  note?: string | null;
  delivery_method?: "home" | "stopdesk";
  stopdesk_id?: string | null;
  stopdesk_name?: string | null;
};

/** Deliberately has no price field. The database would ignore one. */
export type OrderLine = {
  variant_id: string;
  quantity: number;
};

type TrackedOrderItem = {
  product_name: string;
  variant_label: string | null;
  quantity: number;
  unit_price: number;
};

export type TrackedOrder = {
  token: string;
  customer_name: string;
  phone: string;
  wilaya: string;
  commune: string | null;
  address: string;
  delivery_method?: "home" | "stopdesk";
  stopdesk_name?: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: string;
  carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  created_at: string;
  items: TrackedOrderItem[];
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isTokenShaped(token: string): boolean {
  return UUID_RE.test(token.trim());
}

/** Refusals raised by `validate_order()` with a `hint`, translated at checkout. */
const ORDER_ERROR_CODES = [
  "phone_blocked",
  "too_many_pending",
  "too_many_items",
  "too_many_orders",
] as const;
export type OrderErrorCode = (typeof ORDER_ERROR_CODES)[number];

/**
 * Place an order and return its tracking token.
 *
 * Rejects with the database's own message on a validation failure — "Invalid
 * phone", "Variant unavailable" — which is already written for a human to read.
 */
export async function placeOrder(
  customer: OrderCustomer,
  lines: OrderLine[],
): Promise<{ token: string | null; error: string | null; code?: OrderErrorCode }> {
  if (lines.length === 0) {
    return { token: null, error: "Your cart is empty." };
  }
  const { data, error } = await getSupabase().rpc("place_order", {
    p_customer: customer as unknown as Json,
    p_items: lines as unknown as Json,
  });
  if (error) {
    // A known hint is a stable code the checkout can say in the buyer's language.
    const code = (ORDER_ERROR_CODES as readonly string[]).includes(error.hint ?? "")
      ? (error.hint as OrderErrorCode)
      : undefined;
    return { token: null, error: error.message, code };
  }
  return { token: typeof data === "string" ? data : null, error: null };
}

/** Returns null for an unknown or malformed token, never throws. */
export async function trackOrder(token: string): Promise<TrackedOrder | null> {
  if (!isTokenShaped(token)) return null;
  const { data, error } = await getSupabase().rpc("track_order", { p_token: token.trim() });
  if (error) throw new Error(error.message);
  if (!data || typeof data !== "object") return null;
  return data as unknown as TrackedOrder;
}

/** Ordered status flow, used for the tracking timeline and the admin queue. */
export const ORDER_FLOW = ["pending", "confirmed", "shipped", "delivered"] as const;

/** Statuses that stop the flow. Used to grey out the timeline. */
export function isTerminal(status: string): boolean {
  return ["delivered", "refused", "cancelled", "returned"].includes(status);
}
