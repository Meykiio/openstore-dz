import { getSupabase } from "./client";

/**
 * True when Supabase answered but the shop's tables and functions are missing:
 * the project exists and the keys work, but `supabase/schema.sql` was never run.
 * PostgREST reports that as "not found in the schema cache" (PGRST202 for a
 * function, PGRST205 for a table); Postgres itself as 42P01.
 */
export function isEmptyDatabaseError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "PGRST202" || error.code === "PGRST205" || error.code === "42P01") return true;
  return /schema cache/i.test(error.message ?? "");
}

export type DatabaseHealth = { state: "ok" | "empty" | "unreachable"; detail: string };

/**
 * One-call reachability probe used by the setup screen and the dashboard
 * health banner. Never throws: the caller decides how to present the outcome.
 */
export async function pingDatabase(): Promise<DatabaseHealth> {
  try {
    const { error } = await getSupabase().from("store_settings").select("id").limit(1);
    if (!error) return { state: "ok", detail: "Connected" };
    return { state: isEmptyDatabaseError(error) ? "empty" : "unreachable", detail: error.message };
  } catch (e) {
    return { state: "unreachable", detail: e instanceof Error ? e.message : "Unknown error" };
  }
}
