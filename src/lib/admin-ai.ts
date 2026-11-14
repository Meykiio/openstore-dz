import { useQuery } from "@tanstack/react-query";
import { getSupabase } from "./supabase/client";

/**
 * Admin > Integrations: the assistants allowed to manage the shop.
 *
 * Two sources are merged. Supabase Auth knows which assistants the owner signed
 * in (`oauth.listGrants`); the shop's own `ai_connections` table holds the on/off
 * switch the database checks on every assistant request. An assistant signed in
 * but missing from the table is refused until the owner allows it here.
 */

export type Assistant = {
  clientId: string;
  name: string;
  /** Signed in through Supabase (has a live grant). */
  granted: boolean;
  grantedAt: string | null;
  /** Has a row in ai_connections (null: never allowed). */
  enabled: boolean | null;
  lastUsedAt: string | null;
};

export const AI_ASSISTANTS_KEY = ["ai_assistants"] as const;

/** True when the database has not been updated for assistants yet. */
export function isMissingTable(message: string): boolean {
  return /ai_connections|ai_activity/.test(message) && /does not exist|schema cache/.test(message);
}

async function fetchAssistants(): Promise<Assistant[]> {
  const supabase = getSupabase();
  const [grants, rows] = await Promise.all([
    supabase.auth.oauth.listGrants(),
    supabase.from("ai_connections").select("client_id, name, enabled, last_used_at"),
  ]);
  if (rows.error) throw new Error(rows.error.message);
  const byId = new Map<string, Assistant>();
  for (const grant of grants.data ?? []) {
    byId.set(grant.client.id, {
      clientId: grant.client.id,
      name: grant.client.name || "Assistant",
      granted: true,
      grantedAt: grant.granted_at,
      enabled: null,
      lastUsedAt: null,
    });
  }
  for (const row of rows.data) {
    const known = byId.get(row.client_id);
    byId.set(row.client_id, {
      clientId: row.client_id,
      name: known?.name ?? row.name,
      granted: Boolean(known),
      grantedAt: known?.grantedAt ?? null,
      enabled: row.enabled,
      lastUsedAt: row.last_used_at,
    });
  }
  return [...byId.values()].sort((a, b) => (b.grantedAt ?? "").localeCompare(a.grantedAt ?? ""));
}

export function useAssistants() {
  return useQuery({ queryKey: AI_ASSISTANTS_KEY, queryFn: fetchAssistants });
}

/** Allow (or re-allow) an assistant: the row the database checks. */
export async function allowAssistant(clientId: string, name: string): Promise<void> {
  const supabase = getSupabase();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in.");
  const { error } = await supabase
    .from("ai_connections")
    .upsert(
      { client_id: clientId, user_id: data.user.id, name, enabled: true },
      { onConflict: "client_id" },
    );
  if (error) throw new Error(error.message);
}

export async function setAssistantEnabled(clientId: string, enabled: boolean): Promise<void> {
  const { error } = await getSupabase()
    .from("ai_connections")
    .update({ enabled })
    .eq("client_id", clientId);
  if (error) throw new Error(error.message);
}

/**
 * Disconnect for good: Supabase revokes the grant (its sessions and refresh
 * tokens die), and the row goes, so a token still in flight is refused too.
 */
export async function revokeAssistant(clientId: string, granted: boolean): Promise<void> {
  const supabase = getSupabase();
  if (granted) {
    const { error } = await supabase.auth.oauth.revokeGrant({ clientId });
    if (error) throw new Error(error.message);
  }
  const { error } = await supabase.from("ai_connections").delete().eq("client_id", clientId);
  if (error) throw new Error(error.message);
}

export type ActivityRow = {
  id: number;
  client_id: string;
  tool: string;
  kind: string;
  target: string | null;
  ok: boolean;
  detail: string | null;
  created_at: string;
};

async function fetchActivity(clientId: string | null): Promise<ActivityRow[]> {
  let query = getSupabase()
    .from("ai_activity")
    .select("id, client_id, tool, kind, target, ok, detail, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (clientId) query = query.eq("client_id", clientId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export function useAiActivity(clientId: string | null) {
  return useQuery({
    queryKey: ["ai_activity", clientId ?? "all"] as const,
    queryFn: () => fetchActivity(clientId),
    refetchInterval: 30_000,
  });
}
