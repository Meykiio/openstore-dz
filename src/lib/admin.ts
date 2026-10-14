import { queryOptions, useQuery } from "@tanstack/react-query";
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

async function fetchAdminOrders(): Promise<AdminOrder[]> {
  const { data, error } = await getSupabase()
    .from("orders")
    .select(ORDER_SELECT)
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as AdminOrder[];
}

const adminOrdersQuery = () =>
  queryOptions({ queryKey: ["admin_orders"] as const, queryFn: fetchAdminOrders });

export function useAdminOrders() {
  return useQuery(adminOrdersQuery());
}

/** Statuses that still need a phone call. The queue that protects margin. */
export function needsCall(order: AdminOrder): boolean {
  return order.status === "pending";
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
