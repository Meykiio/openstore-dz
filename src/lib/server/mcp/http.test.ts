import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The /mcp edge: who gets in, who is refused, and what Claude is told.
 * Supabase is mocked: `claims` is what the token "contains" and `role` is the
 * caller's row in admin_users.
 */

const ISSUER = "https://example.supabase.co/auth/v1";
const state = { claims: null as Record<string, unknown> | null, role: null as string | null };

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: {
      getClaims: (token: string) => {
        if (token === "garbage") return Promise.reject(new Error("Invalid JWT"));
        return Promise.resolve(
          state.claims
            ? { data: { claims: state.claims }, error: null }
            : { data: null, error: new Error("bad signature") },
        );
      },
    },
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data:
                table === "store_settings"
                  ? { name: "Boutique Test" }
                  : state.role
                    ? { role: state.role }
                    : null,
              error: null,
            }),
        }),
      }),
    }),
  }),
}));

vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");

const { handleMcp, protectedResourceMetadata } = await import("./http");

const LIST = { jsonrpc: "2.0", id: 1, method: "tools/list", params: {} };

function post(headers: Record<string, string> = {}, body: unknown = LIST): Request {
  return new Request("https://shop.example/mcp", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

const ownerClaims = () => ({
  iss: ISSUER,
  sub: "owner-id",
  email: "owner@shop.example",
  client_id: "claude-client",
  exp: Math.floor(Date.now() / 1000) + 600,
});

beforeEach(() => {
  state.claims = null;
  state.role = null;
});

describe("/mcp", () => {
  it("answers 401 with a sign-in pointer when there is no token", async () => {
    const res = await handleMcp(post());
    expect(res.status).toBe(401);
    expect(res.headers.get("www-authenticate")).toContain(
      'resource_metadata="https://shop.example/.well-known/oauth-protected-resource/mcp"',
    );
  });

  it("refuses an unreadable token with 401, not a crash", async () => {
    const res = await handleMcp(post({ authorization: "Bearer garbage" }));
    expect(res.status).toBe(401);
  });

  it("refuses a browser on another site", async () => {
    const res = await handleMcp(post({ origin: "https://evil.example" }));
    expect(res.status).toBe(403);
  });

  it("refuses an admin session token that did not come through OAuth", async () => {
    state.claims = { ...ownerClaims(), client_id: undefined };
    state.role = "owner";
    const res = await handleMcp(post({ authorization: "Bearer t" }));
    expect(res.status).toBe(401);
  });

  it("refuses a token from another issuer", async () => {
    state.claims = { ...ownerClaims(), iss: "https://other.supabase.co/auth/v1" };
    state.role = "owner";
    const res = await handleMcp(post({ authorization: "Bearer t" }));
    expect(res.status).toBe(401);
  });

  it("refuses staff: only the owner can connect", async () => {
    state.claims = ownerClaims();
    state.role = "staff";
    const res = await handleMcp(post({ authorization: "Bearer t" }));
    expect(res.status).toBe(401);
  });

  it("lets the owner list the tools", async () => {
    state.claims = ownerClaims();
    state.role = "owner";
    const res = await handleMcp(post({ authorization: "Bearer t" }));
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("whoami");
  });
});

describe("protected resource metadata", () => {
  it("points Claude at Supabase Auth, one server only", async () => {
    const res = protectedResourceMetadata(
      new Request("https://shop.example/.well-known/oauth-protected-resource/mcp"),
    );
    const body = (await res.json()) as { resource: string; authorization_servers: string[] };
    expect(body.resource).toBe("https://shop.example/mcp");
    expect(body.authorization_servers).toEqual([ISSUER]);
  });
});
