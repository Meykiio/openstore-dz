import { queryOptions, useQuery } from "@tanstack/react-query";
import { getSupabase } from "./supabase/client";
import type { StoreSettings } from "./queries";

/**
 * Delivery pricing.
 *
 * A row in `delivery_zones` overrides the flat fee for that wilaya. The flat fee
 * stays as the fallback so a store is usable before any zone is configured, and
 * so a wilaya the owner forgot still gets a sane number instead of zero.
 *
 * The carrier's own rate becomes authoritative once Guepex is connected; this is
 * the estimate shown before the parcel exists.
 */
export type DeliveryZone = {
  wilaya: string;
  fee: number;
  eta_days: number;
  is_active: boolean;
};

async function fetchZones(): Promise<DeliveryZone[]> {
  const { data, error } = await getSupabase()
    .from("delivery_zones")
    .select("wilaya, fee, eta_days, is_active")
    .eq("is_active", true);
  if (error) throw new Error(error.message);
  return (data ?? []) as DeliveryZone[];
}

const deliveryZonesQuery = () =>
  queryOptions({ queryKey: ["delivery_zones"] as const, queryFn: fetchZones });

export function useDeliveryZones() {
  return useQuery(deliveryZonesQuery());
}

/**
 * Fee and ETA for a wilaya, matched on either script. Falls back to the store's
 * flat fee when no zone row exists.
 */
export function resolveDelivery(
  settings: StoreSettings | null,
  zones: DeliveryZone[],
  wilaya: string | null,
): { fee: number; etaDays: number; source: "zone" | "flat" } {
  const zone = wilaya ? zones.find((z) => z.wilaya === wilaya) : undefined;
  if (zone) return { fee: zone.fee, etaDays: zone.eta_days, source: "zone" };
  return {
    fee: settings?.delivery_fee_flat ?? 0,
    etaDays: settings?.delivery_eta_days ?? 3,
    source: "flat",
  };
}

export async function upsertZone(zone: {
  wilaya: string;
  fee: number;
  eta_days: number;
}): Promise<void> {
  const { error } = await getSupabase()
    .from("delivery_zones")
    .upsert({ ...zone, is_active: true }, { onConflict: "wilaya" });
  if (error) throw new Error(error.message);
}

export async function deleteZone(wilaya: string): Promise<void> {
  const { error } = await getSupabase().from("delivery_zones").delete().eq("wilaya", wilaya);
  if (error) throw new Error(error.message);
}
