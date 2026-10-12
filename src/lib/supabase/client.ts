import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Browser Supabase client.
 *
 * Holds only the publishable (anon) key. Every call is subject to Row Level
 * Security, so this client can never read or write a row a policy forbids.
 * The service-role key must never reach this file.
 */

const MISSING_ENV_MESSAGE =
  "OpenStore is missing its Supabase configuration. Copy .env.example to .env and fill in " +
  "VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY, then restart the dev server. " +
  "If you are setting this up with an AI agent, run the setup prompt in the README.";

function readEnv(): { url: string; key: string } {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const missing: string[] = [];
  if (!url) missing.push("VITE_SUPABASE_URL");
  if (!key) missing.push("VITE_SUPABASE_PUBLISHABLE_KEY");

  if (missing.length > 0) {
    console.error(`[supabase] Missing environment variable(s): ${missing.join(", ")}`);
    throw new Error(MISSING_ENV_MESSAGE);
  }

  return { url: url as string, key: key as string };
}

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
