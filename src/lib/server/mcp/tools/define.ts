import type { McpServer, CallToolResult } from "@modelcontextprotocol/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database, Json } from "../../../supabase/types";
import type { McpCaller } from "../auth";

/**
 * The one way a shop tool is defined.
 *
 * Every call, whatever the tool:
 *   1. `ai_begin` in the database: is this assistant switched on, within its limits?
 *   2. the tool runs with the owner's own token, so RLS applies to every row;
 *   3. `ai_log` records what happened (Admin > Integrations shows it).
 *
 * `destructive` tools (deletes, price changes) run in two steps. Called without a
 * `confirm_code`, nothing changes: the tool returns a plain summary and a one-time
 * code, and the arguments are stored in the database. Called again with the code,
 * it does exactly what was stored, never what the second call sends. The code
 * works once, for 10 minutes, for this assistant and this tool only.
 */

export type ToolContext = {
  db: SupabaseClient<Database>;
  caller: McpCaller;
  /** The shop's public origin, e.g. https://my-shop.example */
  origin: string;
};

type ToolOutput = { text: string; data?: unknown; target?: string };
type Kind = "read" | "write" | "destructive";

type Spec<S extends z.ZodObject> = {
  name: string;
  title: string;
  description: string;
  kind: Kind;
  input: S;
  run: (args: z.infer<S>, ctx: ToolContext) => Promise<ToolOutput>;
  /** Destructive tools: describe what would happen, without doing it. */
  preview?: (args: z.infer<S>, ctx: ToolContext) => Promise<ToolOutput>;
};

/** A database or validation error, turned into words the owner can act on. */
export function explain(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("ai_switched_off"))
    return "This assistant is switched off in Admin > Integrations.";
  if (message.includes("ai_rate_limit_destructive"))
    return "Limit reached: 10 deletes or price changes per hour. Try again later.";
  if (message.includes("ai_rate_limit")) return "Too many requests. Wait a minute and try again.";
  if (message.includes("ai_bad_code"))
    return "That confirmation code is wrong, used or expired. Ask again to get a new one.";
  // Postgres says "does not exist"; PostgREST says "Could not find the function".
  if (
    /ai_begin|ai_log|ai_propose|ai_claim|ai_upload/.test(message) &&
    /does not exist|could not find/i.test(message)
  )
    return "The shop database is not updated for assistants yet. In Admin, the owner copies the update script and runs it in the Supabase SQL Editor.";
  return message;
}

/** The data of a Supabase result, or a readable error (also when it is empty). */
export function must<T>(result: { data: T; error: { message: string } | null }): NonNullable<T> {
  if (result.error) throw new Error(result.error.message);
  if (result.data === null || result.data === undefined) throw new Error("Not found.");
  return result.data;
}

/** Like `must`, for `.maybeSingle()`: no row is an answer, not an error. */
export function maybe<R extends { data: unknown; error: { message: string } | null }>(
  result: R,
): NonNullable<R["data"]> | null {
  if (result.error) throw new Error(result.error.message);
  return (result.data ?? null) as NonNullable<R["data"]> | null;
}

function result(output: ToolOutput): CallToolResult {
  const body =
    output.data === undefined
      ? output.text
      : `${output.text}\n\n${JSON.stringify(output.data, null, 2)}`;
  return { content: [{ type: "text", text: body }] };
}

const failure = (text: string): CallToolResult => ({
  content: [{ type: "text", text }],
  isError: true,
});

async function log(
  ctx: ToolContext,
  tool: string,
  kind: string,
  out: { ok: boolean; target?: string; detail?: string },
) {
  await ctx.db.rpc("ai_log", {
    p_tool: tool,
    p_kind: kind,
    p_target: out.target ?? null,
    p_ok: out.ok,
    p_detail: out.detail ?? null,
  });
}

async function begin(ctx: ToolContext, kind: Kind): Promise<void> {
  const { error } = await ctx.db.rpc("ai_begin", { p_kind: kind });
  if (error) throw new Error(error.message);
}

const CONFIRM = z.object({
  confirm_code: z
    .string()
    .max(20)
    .optional()
    .describe("Leave empty the first time. Send the code from the first answer to carry it out."),
});

export function defineTool<S extends z.ZodObject>(
  server: McpServer,
  ctx: ToolContext,
  spec: Spec<S>,
) {
  const destructive = spec.kind === "destructive";
  const input = destructive ? spec.input.partial().extend(CONFIRM.shape) : spec.input;
  const annotations = {
    title: spec.title,
    readOnlyHint: spec.kind === "read",
    destructiveHint: destructive,
    idempotentHint: spec.kind === "read",
    openWorldHint: false,
  };
  const description = destructive
    ? `${spec.description} Two steps: the first call changes nothing and returns a summary and a code. Show the summary to the owner and call again with confirm_code only after they agree.`
    : spec.description;

  server.registerTool(
    spec.name,
    { title: spec.title, description, inputSchema: input, annotations },
    async (raw: Record<string, unknown>) => {
      const code = destructive ? (raw as { confirm_code?: string }).confirm_code : undefined;
      const kind = destructive && !code ? "propose" : spec.kind;
      let target: string | undefined;
      try {
        await begin(ctx, kind === "propose" ? "read" : spec.kind);
        if (destructive && !code) {
          const args = spec.input.parse(raw);
          if (!spec.preview) throw new Error(`${spec.name} has no preview.`);
          const preview = await spec.preview(args, ctx);
          target = preview.target;
          const minted = must(
            await ctx.db.rpc("ai_propose", {
              p_tool: spec.name,
              p_args: args as Json,
              p_summary: preview.text,
            }),
          );
          await log(ctx, spec.name, "propose", { ok: true, target, detail: preview.text });
          return result({
            text: `${preview.text}\n\nNothing has changed yet. If the owner agrees, call ${spec.name} again with confirm_code "${minted}" (valid 10 minutes, once).`,
            data: preview.data,
          });
        }
        const args = code
          ? spec.input.parse(
              must(await ctx.db.rpc("ai_claim", { p_code: code, p_tool: spec.name })),
            )
          : spec.input.parse(raw);
        const output = await spec.run(args, ctx);
        target = output.target;
        await log(ctx, spec.name, spec.kind, { ok: true, target, detail: output.text });
        return result(output);
      } catch (error) {
        const text = error instanceof z.ZodError ? z.prettifyError(error) : explain(error);
        // Logging a refusal can itself be refused (switched off); that is fine.
        await log(ctx, spec.name, kind, { ok: false, target, detail: text }).catch(() => undefined);
        return failure(text);
      }
    },
  );
}
