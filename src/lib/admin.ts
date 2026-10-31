import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getSupabase } from "./supabase/client";
import type { Database } from "./supabase/types";
import type { StoreSettings } from "./queries";

export type OrderStatus = Database["public"]["Enums"]["order_status"];

/**
 * Admin reads and writes.
 *
 * Every call here runs as the signed-in `authenticated` role and is therefore
 * still subject to RLS. The policies, not this file, decide what an admin may
 * touch — notably `subtotal`, `delivery_fee` and `total` are excluded from the
 * UPDATE grant, so no code path here can rewrite an order's money.
 */

type AdminOrderItem = {
  id: string;
  product_name: string;
  variant_label: string | null;
  quantity: number;
  unit_price: number;
};

export type AdminOrder = {
  id: string;
  public_token: string;
  customer_name: string;
  phone: string;
  wilaya: string;
  commune: string | null;
  address: string;
  note: string | null;
  delivery_method: "home" | "stopdesk";
  stopdesk_id: number | null;
  stopdesk_name: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: string;
  confirmed_at: string | null;
  refused_at: string | null;
  refused_reason: string | null;
  carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  created_at: string;
  order_items: AdminOrderItem[];
};

export const ORDER_SELECT = `
  id, public_token, customer_name, phone, wilaya, commune, address, note,
  delivery_method, stopdesk_id, stopdesk_name,
  subtotal, delivery_fee, total, status, confirmed_at, refused_at, refused_reason,
  carrier, tracking_number, tracking_url, created_at,
  order_items ( id, product_name, variant_label, quantity, unit_price )
`;

/** One page of orders, plus what the pager needs. */
export type OrdersPage = {
  rows: AdminOrder[];
  total: number;
  pageCount: number;
};

/**
 * Orders per page.
 *
 * Fifteen, deliberately small. This is a working queue an owner reads on a phone
 * between calls, and a page that needs scrolling to reach the bottom is a page
 * where the last few orders get skimmed past.
 */
const ORDERS_PAGE_SIZE = 15;

/**
 * A page of orders, newest first.
 *
 * This used to be `.limit(300)` with no paging, which meant a shop with 400 orders
 * silently lost 100 of them from the dashboard. Silent truncation is worse than a
 * slow list: nothing tells the owner that orders are missing.
 *
 * Ordered by `created_at` then `id`. The tiebreaker is not decoration: `created_at`
 * is not unique, and without a stable second key two orders created in the same
 * second can swap places between pages, so one is shown twice and another never.
 */
async function fetchOrdersPage(page: number, status: OrderStatus | null): Promise<OrdersPage> {
  const supabase = getSupabase();
  const from = (Math.max(page, 1) - 1) * ORDERS_PAGE_SIZE;

  let request = supabase
    .from("orders")
    .select(ORDER_SELECT, { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (status) request = request.eq("status", status);

  const { data, error, count } = await request.range(from, from + ORDERS_PAGE_SIZE - 1);
  if (error) throw new Error(error.message);

  const total = count ?? 0;
  return {
    rows: (data ?? []) as unknown as AdminOrder[],
    total,
    pageCount: Math.max(1, Math.ceil(total / ORDERS_PAGE_SIZE)),
  };
}

/**
 * Paged orders. `status` null means every order; a status narrows it server-side.
 *
 * The queue is a filter here, not a client-side re-sort of whatever happened to be
 * loaded. That distinction is the whole reason the badge and the list can disagree
 * with the truth if the filtering is done in the browser.
 */
export function useOrdersPage(page: number, status: OrderStatus | null) {
  return useQuery({
    queryKey: ["admin_orders", page, status ?? "all"] as const,
    queryFn: () => fetchOrdersPage(page, status),
    // Keeps the current page on screen while the next loads, so paging does not
    // flash a loading state over content the owner is already reading.
    placeholderData: keepPreviousData,
  });
}

/** Count only, for the queue badge. Never loads a row. */
async function countOrders(status: OrderStatus): Promise<number> {
  const { count, error } = await getSupabase()
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("status", status);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export function usePendingOrdersCount() {
  return useQuery({
    queryKey: ["admin_orders_count", "pending"] as const,
    queryFn: () => countOrders("pending"),
  });
}

export async function setOrderStatus(
  id: string,
  status: OrderStatus,
  extra: Partial<Pick<AdminOrder, "refused_reason" | "confirmed_at" | "refused_at">> = {},
): Promise<void> {
  const { error } = await getSupabase()
    .from("orders")
    .update({ status, ...extra })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * Delete an order for good (test orders, duplicates). Its lines go with it
 * (`on delete cascade`). The row count is checked because a delete that the
 * database refuses under RLS returns no error, only zero rows.
 */
export async function deleteOrder(id: string): Promise<void> {
  const { data, error } = await getSupabase().from("orders").delete().eq("id", id).select("id");
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("The order could not be deleted.");
}

export async function saveStoreSettings(patch: Partial<StoreSettings>): Promise<void> {
  const { error } = await getSupabase().from("store_settings").update(patch).eq("id", 1);
  if (error) throw new Error(error.message);
}
