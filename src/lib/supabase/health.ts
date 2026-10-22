import { getSupabase } from "./client";

/**
 * One-call reachability probe used by the setup screen and the dashboard
 * health banner. Never throws: the caller decides how to present the outcome.
 */
export async function pingDatabase(): Promise<{ ok: boolean; detail: string }> {
  try {
    const { error } = await getSupabase().from("store_settings").select("id").limit(1);
    if (error) return { ok: false, detail: error.message };
    return { ok: true, detail: "Connected" };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : "Unknown error" };
  }
}
