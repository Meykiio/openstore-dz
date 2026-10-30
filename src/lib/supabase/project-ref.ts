/** `https://<ref>.supabase.co` -> `<ref>`, falling back to the project id variable. */
export function projectRef(): string | null {
  const url = import.meta.env.VITE_SUPABASE_URL;
  try {
    const host = new URL(url ?? "").hostname;
    if (host.endsWith(".supabase.co")) return host.split(".")[0];
  } catch {
    /* not a URL: fall through */
  }
  return import.meta.env.VITE_SUPABASE_PROJECT_ID || null;
}
