import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Connecting the owner's Telegram bot: token check, finding the owner's chat by
 * the one-time Start code, and who may call /api/telegram.
 */

const owner = { ok: true };
const saved: Record<string, unknown>[] = [];

vi.mock("./mcp/auth", () => ({
  verifyOwnerSession: () => Promise.resolve(owner.ok),
  callerClient: () => ({
    rpc: (_name: string, args: Record<string, unknown>) => {
      saved.push(args);
      return Promise.resolve({ error: null });
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: { name: "Boutique Lina" }, error: null }),
        }),
      }),
    }),
  }),
}));

const { botName, findChat } = await import("./telegram");
const { handleTelegram } = await import("./telegram-route");

const TOKEN = "123456789:AAbbCCddEEffGGhhIIjjKKll";
const CODE = "0123456789abcdef";

type Call = { method: string; body: Record<string, unknown> };
let calls: Call[] = [];

/** Fake Telegram: answers per method. */
function telegram(answers: Record<string, unknown>) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string, init: { body: string }) => {
      const method = url.split("/").at(-1) ?? "";
      calls.push({ method, body: JSON.parse(init.body) as Record<string, unknown> });
      return Promise.resolve(Response.json(answers[method] ?? { ok: true, result: true }));
    }),
  );
}

const update = (id: number, text: string, type = "private", chat = 42) => ({
  update_id: id,
  message: { text, chat: { id: chat, type } },
});

beforeEach(() => {
  calls = [];
  saved.length = 0;
  owner.ok = true;
});
afterEach(() => vi.unstubAllGlobals());

describe("botName", () => {
  it("returns the bot's username", async () => {
    telegram({ getMe: { ok: true, result: { username: "shop_orders_bot" } } });
    await expect(botName(TOKEN)).resolves.toBe("shop_orders_bot");
  });
  it("explains a wrong token", async () => {
    telegram({ getMe: { ok: false, description: "Unauthorized" } });
    await expect(botName(TOKEN)).rejects.toThrow("Unauthorized");
  });
});

describe("findChat", () => {
  it("finds the private chat that sent the code, ignoring others", async () => {
    telegram({
      getUpdates: {
        ok: true,
        result: [
          update(1, "/start somethingelse", "private", 7),
          update(2, `/start ${CODE}`, "group", 8),
          update(3, `/start ${CODE}`, "private", 42),
        ],
      },
    });
    await expect(findChat(TOKEN, CODE)).resolves.toBe(42);
  });
  it("leaves messages unread, so a retry still sees them", async () => {
    telegram({ getUpdates: { ok: true, result: [update(3, `/start ${CODE}`)] } });
    await findChat(TOKEN, CODE);
    expect(calls).toHaveLength(1);
    expect(calls[0].body).not.toHaveProperty("offset");
  });
  it("accepts the code pasted as a plain message after an earlier Start", async () => {
    telegram({
      getUpdates: {
        ok: true,
        result: [update(1, "/start", "private", 42), update(2, ` ${CODE} `)],
      },
    });
    await expect(findChat(TOKEN, CODE)).resolves.toBe(42);
  });
  it("a plain /start without the code is not enough", async () => {
    telegram({ getUpdates: { ok: true, result: [update(1, "/start")] } });
    await expect(findChat(TOKEN, CODE)).resolves.toBeNull();
  });
  it("the newest message with the code wins", async () => {
    telegram({
      getUpdates: {
        ok: true,
        result: [update(1, CODE, "private", 7), update(2, CODE, "private", 42)],
      },
    });
    await expect(findChat(TOKEN, CODE)).resolves.toBe(42);
  });
  it("answers null when Start was not pressed", async () => {
    telegram({ getUpdates: { ok: true, result: [] } });
    await expect(findChat(TOKEN, CODE)).resolves.toBeNull();
  });
});

function post(body: unknown, headers: Record<string, string> = {}) {
  return new Request("https://shop.example/api/telegram", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer s", ...headers },
    body: JSON.stringify(body),
  });
}

describe("/api/telegram", () => {
  it("refuses another site", async () => {
    const res = await handleTelegram(post({}, { origin: "https://evil.example" }));
    expect(res.status).toBe(403);
  });
  it("refuses anyone but the owner", async () => {
    owner.ok = false;
    expect((await handleTelegram(post({ action: "check", token: TOKEN }))).status).toBe(401);
  });
  it("refuses a malformed token without calling Telegram", async () => {
    telegram({});
    const res = await handleTelegram(post({ action: "check", token: "nope" }));
    expect(res.status).toBe(400);
    expect(calls).toHaveLength(0);
  });
  it("links: saves token and chat, then says hello", async () => {
    telegram({
      getMe: { ok: true, result: { username: "shop_orders_bot" } },
      getUpdates: { ok: true, result: [update(9, `/start ${CODE}`)] },
    });
    const res = await handleTelegram(
      post({ action: "link", token: TOKEN, code: CODE, lang: "fr" }),
    );
    expect(res.status).toBe(200);
    expect(saved[0]).toMatchObject({
      p_bot_token: TOKEN,
      p_bot_username: "shop_orders_bot",
      p_chat_id: 42,
      p_site_url: "https://shop.example",
      p_lang: "fr",
    });
    expect(calls.find((c) => c.method === "sendMessage")?.body).toMatchObject({
      chat_id: 42,
      text: "Boutique Lina: Notifications activées. Chaque nouvelle commande arrivera ici.",
    });
  });
  it("links in Arabic when the language is missing or unknown", async () => {
    telegram({
      getMe: { ok: true, result: { username: "shop_orders_bot" } },
      getUpdates: { ok: true, result: [update(9, `/start ${CODE}`)] },
    });
    await handleTelegram(post({ action: "link", token: TOKEN, code: CODE, lang: "de" }));
    expect(saved[0]).toMatchObject({ p_lang: "ar" });
  });
  it("tells the owner to tap Start when the code has not arrived", async () => {
    telegram({
      getMe: { ok: true, result: { username: "shop_orders_bot" } },
      getUpdates: { ok: true, result: [] },
    });
    const res = await handleTelegram(post({ action: "link", token: TOKEN, code: CODE }));
    expect(res.status).toBe(404);
    expect(saved).toHaveLength(0);
  });
});
