import { queryOptions } from "@tanstack/react-query";
import { getSupabase } from "./supabase/client";

/** The OpenStore version this build was made from. */
export const APP_VERSION: string = __APP_VERSION__;

/**
 * The database this code expects. Bump it whenever `supabase/schema.sql`
 * changes, together with `openstore_schema_version()` in that file, so the
 * dashboard can tell an owner who updated the code but not the database.
 */
export const SCHEMA_VERSION = 3;

const LATEST_URL = "https://raw.githubusercontent.com/Meykiio/openstore-dz/main/package.json";

/** True when `latest` is a higher x.y.z than `current`. */
export function isNewer(latest: string, current: string): boolean {
  const parse = (v: string) => v.split(".").map((part) => Number.parseInt(part, 10) || 0);
  const [a, b] = [parse(latest), parse(current)];
  for (let i = 0; i < 3; i++) {
    if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) > (b[i] ?? 0);
  }
  return false;
}

/**
 * The database's version. A database set up before versions existed has no
 * such function, which reads as 1: it needs the update either way.
 */
export const schemaVersionQuery = () =>
  queryOptions({
    queryKey: ["schema_version"],
    queryFn: async (): Promise<number> => {
      const { data, error } = await getSupabase().rpc("openstore_schema_version");
      // PGRST202: no such function, i.e. a database from before 0.2.0. Any other
      // failure is not an answer, so no notice is shown on a network blip.
      if (error?.code === "PGRST202") return 1;
      if (error) throw new Error(error.message);
      return typeof data === "number" ? data : 1;
    },
    staleTime: 10 * 60_000,
  });

/**
 * The newest OpenStore version published on GitHub. Asked from the owner's
 * dashboard only, never from a buyer's page; any failure means "no notice".
 */
export const latestVersionQuery = () =>
  queryOptions({
    queryKey: ["openstore_latest"],
    // A failure throws, so it is retried on the next visit instead of being
    // remembered as "no new version" for six hours.
    queryFn: async (): Promise<string | null> => {
      const response = await fetch(LATEST_URL, { cache: "no-store" });
      if (!response.ok) throw new Error(`GitHub answered ${response.status}`);
      const body = (await response.json()) as { version?: unknown };
      return typeof body.version === "string" ? body.version : null;
    },
    staleTime: 6 * 60 * 60_000,
    retry: false,
  });
