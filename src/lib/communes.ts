import { queryOptions, useQuery } from "@tanstack/react-query";
import { WILAYAS } from "./wilayas";

/**
 * Communes per wilaya, for the checkout's suggestions.
 *
 * A static file in `public/data`, fetched only once a buyer picks a wilaya, so
 * the 18 KB never weigh on any other page. Built by
 * `scripts/build-communes.mjs`; the dataset is MIT-licensed and credited inside
 * the file. Suggestions only: a buyer can always type a commune that is missing.
 */
type CommuneFile = { wilayas: Record<string, [latin: string, arabic: string][]> };

const communesQuery = queryOptions({
  queryKey: ["communes"] as const,
  queryFn: async (): Promise<CommuneFile> => {
    const res = await fetch("/data/communes.json");
    if (!res.ok) throw new Error(`communes.json: ${res.status}`);
    return (await res.json()) as CommuneFile;
  },
  staleTime: Infinity,
});

/** `[latin, arabic]` pairs for a wilaya stored by its Latin name. */
export function useCommunes(wilaya: string): [string, string][] {
  const code = WILAYAS.find((w) => w.fr === wilaya)?.code;
  const { data } = useQuery({ ...communesQuery, enabled: code !== undefined });
  return code !== undefined && data ? (data.wilayas[String(code)] ?? []) : [];
}
