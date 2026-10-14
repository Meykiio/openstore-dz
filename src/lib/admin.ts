import { queryOptions, useInfiniteQuery, useQuery } from "@tanstack/react-query";
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

const ORDER_SELECT = `
  id, public_token, customer_name, phone, wilaya, commune, address, note,
  subtotal, delivery_fee, total, status, confirmed_at, refused_at, refused_reason,
  carrier, tracking_number, tracking_url, created_at,
  order_items ( id, product_name, variant_label, quantity, unit_price )
`;

/** One page of orders, plus what is needed to ask for the next one. */
export type OrdersPage = {
  rows: AdminOrder[];
  total: number;
  nextOffset: number | null;
};

const ORDERS_PAGE_SIZE = 20;

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
async function fetchOrdersPage(offset: number, status: OrderStatus | null): Promise<OrdersPage> {
  const supabase = getSupabase();
  let request = supabase
    .from("orders")
    .select(ORDER_SELECT, { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (status) request = request.eq("status", status);

  const { data, error, count } = await request.range(offset, offset + ORDERS_PAGE_SIZE - 1);
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as AdminOrder[];
  const total = count ?? 0;
  const consumed = offset + rows.length;
  return { rows, total, nextOffset: consumed < total ? consumed : null };
}

/**
 * Paged orders. `status` null means every order; a status narrows it server-side.
 *
 * The queue is a filter here, not a client-side re-sort of whatever happened to be
 * loaded. That distinction is the whole reason the badge and the list can disagree
 * with the truth if the filtering is done in the browser.
 */
export function useOrdersPage(status: OrderStatus | null) {
  return useInfiniteQuery({
    queryKey: ["admin_orders", status ?? "all"] as const,
    queryFn: ({ pageParam }) => fetchOrdersPage(pageParam, status),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextOffset,
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

type AdminReview = {
  id: string;
  product_id: string | null;
  customer_name: string;
  rating: number;
  comment: string;
  image_url: string | null;
  is_approved: boolean;
  created_at: string;
  products: { name: string; slug: string } | null;
};

async function fetchAdminReviews(): Promise<AdminReview[]> {
  const { data, error } = await getSupabase()
    .from("reviews")
    .select(
      "id, product_id, customer_name, rating, comment, image_url, is_approved, created_at, products ( name, slug )",
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as AdminReview[];
}

const adminReviewsQuery = () =>
  queryOptions({ queryKey: ["admin_reviews"] as const, queryFn: fetchAdminReviews });

export function useAdminReviews() {
  return useQuery(adminReviewsQuery());
}

export async function setReviewApproval(id: string, approved: boolean): Promise<void> {
  const { error } = await getSupabase()
    .from("reviews")
    .update({ is_approved: approved })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteReview(id: string): Promise<void> {
  const { error } = await getSupabase().from("reviews").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function saveStoreSettings(patch: Partial<StoreSettings>): Promise<void> {
  const { error } = await getSupabase().from("store_settings").update(patch).eq("id", 1);
  if (error) throw new Error(error.message);
}
