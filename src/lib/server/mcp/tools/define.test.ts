import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/server";
import { defineTool, explain, type ToolContext } from "./define";

/**
 * The tool wrapper: limits and logging around every call, and the two-step
 * confirm that makes a destructive tool do exactly what was previewed.
 */

type Handler = (
  raw: Record<string, unknown>,
) => Promise<{ content: { text: string }[]; isError?: boolean }>;

function harness(
  rpc: (
    name: string,
    args: Record<string, unknown>,
  ) => { data: unknown; error: { message: string } | null },
) {
  const calls: { name: string; args: Record<string, unknown> }[] = [];
  const tools = new Map<
    string,
    { config: { annotations: Record<string, unknown> }; handler: Handler }
  >();
  const server = {
    registerTool: (
      name: string,
      config: { annotations: Record<string, unknown> },
      handler: Handler,
    ) => tools.set(name, { config, handler }),
  } as unknown as McpServer;
  const db = {
    rpc: (name: string, args: Record<string, unknown>) => {
      calls.push({ name, args });
      return Promise.resolve(rpc(name, args));
    },
  };
  const ctx = {
    db,
    caller: { userId: "u", email: null, clientId: "c" },
    origin: "https://x",
  } as unknown as ToolContext;
  return { server, ctx, calls, tools };
}

const ok = (data: unknown = null) => ({ data, error: null });

describe("defineTool", () => {
  it("begins, runs and logs a read, with read-only hints", async () => {
    const h = harness(() => ok());
    defineTool(h.server, h.ctx, {
      name: "peek",
      title: "Peek",
      kind: "read",
      description: "d",
      input: z.object({ n: z.number() }),
      run: async ({ n }) => ({ text: `saw ${n}` }),
    });
    const tool = h.tools.get("peek")!;
    expect(tool.config.annotations).toMatchObject({ readOnlyHint: true, destructiveHint: false });
    const res = await tool.handler({ n: 2 });
    expect(res.content[0].text).toBe("saw 2");
    expect(h.calls.map((c) => c.name)).toEqual(["ai_begin", "ai_log"]);
    expect(h.calls[1].args).toMatchObject({ p_kind: "read", p_ok: true });
  });

  it("refuses when the assistant is switched off, and says so plainly", async () => {
    const h = harness((name) =>
      name === "ai_begin" ? { data: null, error: { message: "ai_switched_off" } } : ok(),
    );
    const run = vi.fn();
    defineTool(h.server, h.ctx, {
      name: "w",
      title: "W",
      kind: "write",
      description: "d",
      input: z.object({}),
      run,
    });
    const res = await h.tools.get("w")!.handler({});
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("switched off");
    expect(run).not.toHaveBeenCalled();
  });

  it("a destructive tool previews first and changes nothing", async () => {
    const h = harness((name) => (name === "ai_propose" ? ok("ABCD1234") : ok()));
    const run = vi.fn();
    defineTool(h.server, h.ctx, {
      name: "zap",
      title: "Zap",
      kind: "destructive",
      description: "d",
      input: z.object({ id: z.string() }),
      preview: async ({ id }) => ({ text: `Zap ${id}` }),
      run,
    });
    const tool = h.tools.get("zap")!;
    expect(tool.config.annotations).toMatchObject({ destructiveHint: true, readOnlyHint: false });
    const res = await tool.handler({ id: "a" });
    expect(run).not.toHaveBeenCalled();
    expect(res.content[0].text).toContain("Zap a");
    expect(res.content[0].text).toContain("ABCD1234");
    const propose = h.calls.find((c) => c.name === "ai_propose")!;
    expect(propose.args).toMatchObject({ p_tool: "zap", p_args: { id: "a" } });
    expect(h.calls.at(-1)!.args).toMatchObject({ p_kind: "propose" });
  });

  it("with the code, runs the stored arguments, not the ones sent again", async () => {
    const h = harness((name) => (name === "ai_claim" ? ok({ id: "stored" }) : ok()));
    const run = vi.fn(async ({ id }: { id: string }) => ({ text: `zapped ${id}` }));
    defineTool(h.server, h.ctx, {
      name: "zap",
      title: "Zap",
      kind: "destructive",
      description: "d",
      input: z.object({ id: z.string() }),
      preview: async () => ({ text: "p" }),
      run,
    });
    const res = await h.tools.get("zap")!.handler({ id: "other", confirm_code: "abcd1234" });
    expect(run).toHaveBeenCalledWith({ id: "stored" }, h.ctx);
    expect(res.content[0].text).toBe("zapped stored");
    expect(h.calls[0].args).toEqual({ p_kind: "destructive" });
    expect(h.calls.at(-1)!.args).toMatchObject({ p_kind: "destructive", p_ok: true });
  });

  it("a wrong code is refused and logged", async () => {
    const h = harness((name) =>
      name === "ai_claim" ? { data: null, error: { message: "ai_bad_code" } } : ok(),
    );
    const run = vi.fn();
    defineTool(h.server, h.ctx, {
      name: "zap",
      title: "Zap",
      kind: "destructive",
      description: "d",
      input: z.object({ id: z.string() }),
      preview: async () => ({ text: "p" }),
      run,
    });
    const res = await h.tools.get("zap")!.handler({ confirm_code: "nope" });
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("confirmation code");
    expect(run).not.toHaveBeenCalled();
    expect(h.calls.at(-1)!.args).toMatchObject({ p_ok: false });
  });

  it("rejects bad input with a readable message", async () => {
    const h = harness(() => ok());
    defineTool(h.server, h.ctx, {
      name: "w",
      title: "W",
      kind: "write",
      description: "d",
      input: z.object({ price: z.number().int().min(0) }),
      run: async () => ({ text: "x" }),
    });
    const res = await h.tools.get("w")!.handler({ price: -5 });
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("price");
  });
});

describe("explain", () => {
  it("names the missing database update, from PostgREST and from Postgres", () => {
    for (const message of [
      "Could not find the function public.ai_begin(p_kind) in the schema cache",
      "function public.ai_log(text, text, text, boolean, text) does not exist",
    ])
      expect(explain(new Error(message))).toContain("update script");
  });
  it("names the hourly limit", () => {
    expect(explain(new Error("ai_rate_limit_destructive"))).toContain("10");
  });
});
