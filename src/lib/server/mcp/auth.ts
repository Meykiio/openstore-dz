import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { OAuthError, OAuthErrorCode, type AuthInfo } from "@modelcontextprotocol/server";
import { readEnv } from "../../supabase/env";
import type { Database } from "../../supabase/types";

/**
 * Who is calling /mcp, proven by the token alone.
 *
 * The assistant signs in through Supabase Auth's OAuth 2.1 server, so its
 * access token is an ordinary Supabase JWT for the owner's own account. It is
 * verified locally against the project's public signing key (ES256, published
 * at /auth/v1/.well-known/jwks.json), never trusted on its face.
 *
 * Two extra rules on top of a valid signature:
 * - the token must carry `client_id`, which only OAuth-issued tokens have, so a
 *   copied browser session from the admin cannot be replayed here;
 * - the account must be the shop owner. Staff can never connect an assistant.
 *   The database repeats this check (has_admin_role), so it does not rest on this
 *   file alone.
 */

export type McpCaller = {
  userId: string;
  email: string | null;
  clientId: string;
  /** The shop name from store_settings, for the instructions and whoami. */
  shopName: string;
};

/** The issuer every accepted token must name. */
export function issuerUrl(): string {
  return `${readEnv().url}/auth/v1`;
}

/** A Supabase client that acts as the caller, so Row Level Security applies. */
export function callerClient(token: string): SupabaseClient<Database> {
  const { url, key } = readEnv();
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

let verifierClient: SupabaseClient<Database> | null = null;

function verifier(): SupabaseClient<Database> {
  if (verifierClient) return verifierClient;
  const { url, key } = readEnv();
  verifierClient = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return verifierClient;
}

const refuse = (message: string) => new OAuthError(OAuthErrorCode.InvalidToken, message);

/** Verify the token and return what the MCP SDK needs, or throw a 401. */
export async function verifyAccessToken(token: string): Promise<AuthInfo> {
  // getClaims throws on a token it cannot even parse, rather than returning an
  // error, so both paths end in the same 401.
  const result = await verifier()
    .auth.getClaims(token)
    .catch(() => null);
  const data = result?.error ? null : result?.data;
  if (!data) throw refuse("The token could not be verified.");

  const claims = data.claims as Record<string, unknown>;
  const clientId = typeof claims.client_id === "string" ? claims.client_id : null;
  const userId = typeof claims.sub === "string" ? claims.sub : null;

  if (claims.iss !== issuerUrl()) throw refuse("The token was issued by someone else.");
  if (!clientId || !userId) throw refuse("Only tokens from a connected assistant are accepted.");

  const db = callerClient(token);
  const [{ data: row }, { data: shop }] = await Promise.all([
    db.from("admin_users").select("role").eq("user_id", userId).maybeSingle(),
    db.from("store_settings").select("name").eq("id", 1).maybeSingle(),
  ]);
  if (row?.role !== "owner") throw refuse("Only the shop owner can connect an assistant.");

  const caller: McpCaller = {
    userId,
    email: typeof claims.email === "string" ? claims.email : null,
    clientId,
    shopName: shop?.name.trim() || "the shop",
  };
  return {
    token,
    clientId,
    scopes: typeof claims.scope === "string" ? claims.scope.split(" ").filter(Boolean) : [],
    expiresAt: typeof claims.exp === "number" ? claims.exp : undefined,
    extra: { caller },
  };
}

/**
 * The owner signed in normally in a browser (no `client_id`): for the photo
 * upload page's Drive import, which an assistant must never be able to call.
 */
export async function verifyOwnerSession(token: string): Promise<boolean> {
  const result = await verifier()
    .auth.getClaims(token)
    .catch(() => null);
  const claims = result?.error
    ? null
    : (result?.data?.claims as Record<string, unknown> | undefined);
  if (!claims || claims.iss !== issuerUrl() || claims.client_id || typeof claims.sub !== "string") {
    return false;
  }
  const { data: row } = await callerClient(token)
    .from("admin_users")
    .select("role")
    .eq("user_id", claims.sub)
    .maybeSingle();
  return row?.role === "owner";
}

/** Read back the caller stored by `verifyAccessToken`. */
export function callerOf(authInfo: AuthInfo | undefined): McpCaller | null {
  const caller = authInfo?.extra?.caller;
  return caller && typeof caller === "object" ? (caller as McpCaller) : null;
}
