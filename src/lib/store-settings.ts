import { queryOptions, useQuery } from "@tanstack/react-query";
import { getSupabase } from "./supabase/client";

/**
 * Store settings.
 *
 * Split out of `queries.ts` when that file reached the 250-line limit, and because
 * it is a real seam: this is the single shop-wide row, read by the storefront for
 * its name and policy text and written by the settings screen. Nothing here
 * depends on the catalogue, and the catalogue does not depend on it.
 *
 * `queries.ts` re-exports all of it, so existing imports keep working.
 */
export type StoreSettings = {
  id: number;
  name: string;
  tagline: string | null;
  description: string | null;
  tagline_fr: string | null;
  description_fr: string | null;
  address_fr: string | null;
  logo_url: string | null;
  banner_url: string | null;
  brand_color: string | null;
  legal_name: string | null;
  nif: string | null;
  rc_number: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  free_shipping_threshold: number;
  currency: string;
  delivery_fee_flat: number;
  delivery_wilayas: string[];
  delivery_eta_days: number;
  returns_days: number;
  accepts_cod: boolean;
  guepex_from_wilaya: string | null;
  announcement: string | null;
  announcement_enabled: boolean;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  returns_note: string | null;
};

async function fetchSettings(): Promise<StoreSettings | null> {
  const { data, error } = await getSupabase()
    .from("store_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as StoreSettings | null) ?? null;
}

export const storeSettingsQuery = () =>
  queryOptions({ queryKey: ["store_settings"] as const, queryFn: fetchSettings });

export function useStoreSettings() {
  return useQuery(storeSettingsQuery());
}
