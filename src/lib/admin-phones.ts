import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query";
import { getSupabase } from "./supabase/client";

/**
 * A phone number's track record, for the order queue. Counted in the database
 * across every order, not just the page on screen, and normalised there so
 * "+213 555..." and "0555..." are one buyer.
 */
export type PhoneHistory = {
  phone: string;
  orders: number;
  refused: number;
  delivered: number;
  blocked: boolean;
};

/** Mirrors `canonical_dz_phone()` so a row can find its own history. */
export function canonicalPhone(raw: string): string {
  const p = raw.replace(/[^0-9+]/g, "");
  return /^\+?213/.test(p) ? `0${p.replace(/^\+?213/, "")}` : p;
}

async function fetchHistory(phones: string[]): Promise<Map<string, PhoneHistory>> {
  if (phones.length === 0) return new Map();
  const { data, error } = await getSupabase().rpc("admin_phone_history", { p_phones: phones });
  if (error) throw new Error(error.message);
  return new Map(
    ((data ?? []) as PhoneHistory[]).map((row) => [
      row.phone,
      {
        ...row,
        orders: Number(row.orders),
        refused: Number(row.refused),
        delivered: Number(row.delivered),
      },
    ]),
  );
}

export const PHONE_HISTORY_KEY = "phone_history";

export function usePhoneHistory(phones: string[]) {
  const unique = [...new Set(phones.map(canonicalPhone))].sort();
  return useQuery(
    queryOptions({
      queryKey: [PHONE_HISTORY_KEY, unique] as const,
      queryFn: () => fetchHistory(unique),
      placeholderData: keepPreviousData,
    }),
  );
}

export async function blockPhone(phone: string): Promise<void> {
  const { error } = await getSupabase()
    .from("blocked_phones")
    .insert({ phone: canonicalPhone(phone) });
  // Already blocked is the outcome the owner wanted.
  if (error && error.code !== "23505") throw new Error(error.message);
}

export async function unblockPhone(phone: string): Promise<void> {
  const { error } = await getSupabase()
    .from("blocked_phones")
    .delete()
    .eq("phone", canonicalPhone(phone));
  if (error) throw new Error(error.message);
}
