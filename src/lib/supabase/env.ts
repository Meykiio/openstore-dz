/**
 * The Supabase address and publishable key, read once. Kept apart from the
 * browser client so server code (the /mcp route) can read them without the
 * browser client's session storage.
 */

export const MISSING_ENV_MESSAGE =
  "OpenStore is missing its Supabase configuration. Copy .env.example to .env and fill in " +
  "VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY, then restart the dev server. " +
  "If you are setting this up with an AI agent, run the setup prompt in the README.";

/**
 * Trimmed, because values pasted into a hosting dashboard often carry a hidden
 * line break. Supabase's client tolerates it, but the address is also compared
 * with a token's issuer (/mcp) and published to Claude, where it must be exact.
 */
export function readEnv(): { url: string; key: string } {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim().replace(/\/+$/, "");
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

  const missing: string[] = [];
  if (!url) missing.push("VITE_SUPABASE_URL");
  if (!key) missing.push("VITE_SUPABASE_PUBLISHABLE_KEY");

  if (missing.length > 0) {
    console.error(`[supabase] Missing environment variable(s): ${missing.join(", ")}`);
    throw new Error(MISSING_ENV_MESSAGE);
  }

  return { url: url as string, key: key as string };
}
