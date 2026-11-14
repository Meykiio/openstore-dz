import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { MISSING_ENV_MESSAGE, readEnv } from "./env";
import type { Database } from "./types";

/**
 * Browser Supabase client.
 *
 * Holds only the publishable (anon) key. Every call is subject to Row Level
 * Security, so this client can never read or write a row a policy forbids.
 * The service-role key must never reach this file.
 */

let client: SupabaseClient<Database> | null = null;

export function getSupabase(): SupabaseClient<Database> {
  if (client) return client;
  const { url, key } = readEnv();
  client = createClient<Database>(url, key, {
    auth: {
      storage: typeof window === "undefined" ? undefined : window.localStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return client;
}

/**
 * Environment check used by the dashboard and the setup health screen. Returns
 * a reason rather than throwing, so the UI can explain instead of crashing.
 */
export function supabaseConfigProblem(): string | null {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
    return MISSING_ENV_MESSAGE;
  }
  return null;
}
