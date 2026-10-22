import { queryOptions, useQuery } from "@tanstack/react-query";
import { getSupabase } from "./supabase/client";

/**
 * Dashboard analytics.
 *
 * All aggregation happens in the database, in one function, one round trip. The
 * alternative (fetch a few hundred orders and sum them in the browser) is
 * quietly wrong rather than loudly wrong: the fetch is capped, so past a certain
 * order count the totals keep looking plausible while being incomplete.
 */

export type RevenueDay = { day: string; orders: number; value: number };

export type WilayaStat = {
  wilaya: string;
  total: number;
  delivered: number;
  refused: number;
  /** refused / total, 0 to 1. */
  rate: number;
};

type TopProduct = { name: string; units: number; value: number };

type LowStockRow = { id: string; product: string; label: string | null; stock: number };

export type Analytics = {
  days: number;
  revenue: RevenueDay[];
  funnel: Record<string, number>;
  totals: { orders: number; confirmedValue: number; refused: number };
  byWilaya: WilayaStat[];
  topProducts: TopProduct[];
  lowStock: LowStockRow[];
};

async function fetchAnalytics(days: number): Promise<Analytics> {
  const { data, error } = await getSupabase().rpc("admin_analytics", { p_days: days });
  if (error) throw new Error(error.message);
  // The RPC is typed as Json, so narrow once here rather than casting at every
  // use site.
  return data as unknown as Analytics;
}

const analyticsQuery = (days: number) =>
  queryOptions({
    queryKey: ["admin_analytics", days] as const,
    queryFn: () => fetchAnalytics(days),
  });

export function useAnalytics(days: number) {
  return useQuery(analyticsQuery(days));
}

/** Share of orders that failed to become sales, 0 to 1. */
export function refusalRate(analytics: Analytics | undefined): number {
  if (!analytics || analytics.totals.orders === 0) return 0;
  return analytics.totals.refused / analytics.totals.orders;
}

/**
 * A wilaya worth acting on.
 *
 * Twenty percent is the line: below it a refusal is the cost of doing business,
 * above it the parcel is likely losing money once the outbound and the return
 * are both paid for. The threshold is a judgement call, not a computed fact,
 * and it is here rather than in the component so it can be changed in one place
 * once real numbers exist.
 */
export const WORRYING_REFUSAL_RATE = 0.2;

export function wilayasToWatch(analytics: Analytics | undefined): WilayaStat[] {
  return (analytics?.byWilaya ?? []).filter((entry) => entry.rate >= WORRYING_REFUSAL_RATE);
}

/** Percentage change between the two halves of the window, or null if unseen. */
export function revenueTrend(analytics: Analytics | undefined): number | null {
  const days = analytics?.revenue ?? [];
  if (days.length < 4) return null;

  const midpoint = Math.floor(days.length / 2);
  const sum = (rows: RevenueDay[]) => rows.reduce((total, row) => total + row.value, 0);
  const earlier = sum(days.slice(0, midpoint));
  const later = sum(days.slice(midpoint));
  if (earlier === 0) return later === 0 ? null : 1;
  return (later - earlier) / earlier;
}
