import { getSupabase } from "./supabase/client";
import type { StoreSettings } from "./store-settings";
import { WILAYAS } from "./wilayas";

/**
 * What a shop still shows buyers that is missing or made up.
 *
 * A fresh install ships demo contact details so the storefront renders, and the
 * reference shop went live with them: a WhatsApp button to a number nobody
 * answers and a tax number of zeros. This is the list the dashboard nags about
 * until each is real.
 */
export type SetupGap = "name" | "phone" | "whatsapp" | "delivery" | "legal";

const DEMO_NAMES = new Set(["", "my shop", "openstore dz"]);

/** Mirrors `is_valid_dz_phone()` in schema.sql: mobile or landline, local or +213. */
export function isValidDzPhone(raw: string | null | undefined): boolean {
  const p = (raw ?? "").replace(/[^0-9+]/g, "");
  return (
    /^0[5-7][0-9]{8}$/.test(p) ||
    /^\+?213[5-7][0-9]{8}$/.test(p) ||
    /^0[2-4][0-9]{7,8}$/.test(p) ||
    /^\+?213[2-4][0-9]{7,8}$/.test(p)
  );
}

/** The demo seed's numbers are mostly zeros; a real one never is. */
export function isPlaceholder(value: string | null | undefined): boolean {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits.length === 0 || /0{6,}/.test(digits);
}

export function setupGaps(settings: StoreSettings | null, zoneCount: number): SetupGap[] {
  if (!settings) return [];
  const gaps: SetupGap[] = [];
  if (DEMO_NAMES.has(settings.name.trim().toLowerCase())) gaps.push("name");
  if (!isValidDzPhone(settings.phone) || isPlaceholder(settings.phone)) gaps.push("phone");
  if (isPlaceholder(settings.whatsapp)) gaps.push("whatsapp");
  if (zoneCount === 0) gaps.push("delivery");
  if (
    !settings.legal_name?.trim() ||
    isPlaceholder(settings.nif) ||
    isPlaceholder(settings.rc_number)
  ) {
    gaps.push("legal");
  }
  return gaps;
}

/**
 * The southern wilayas, by official code. Two price tiers are what most owners
 * start with; the delivery screen refines any single wilaya afterwards.
 */
const SOUTH = new Set([1, 3, 7, 8, 11, 30, 33, 37, 39, 47, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58]);

export function zonesFor(
  north: number,
  south: number,
  pickup: { north: number | null; south: number | null } = { north: null, south: null },
) {
  return WILAYAS.map((w) => ({
    // Latin names: the carrier matches on them, and so does the checkout.
    wilaya: w.fr,
    fee: SOUTH.has(w.code) ? south : north,
    stopdesk_fee: SOUTH.has(w.code) ? pickup.south : pickup.north,
    eta_days: SOUTH.has(w.code) ? 5 : 3,
    is_active: true,
  }));
}

export async function saveAllZones(
  north: number,
  south: number,
  pickup: { north: number | null; south: number | null },
): Promise<void> {
  const { error } = await getSupabase()
    .from("delivery_zones")
    .upsert(zonesFor(north, south, pickup), { onConflict: "wilaya" });
  if (error) throw new Error(error.message);
}
