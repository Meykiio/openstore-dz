import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { defineTool, maybe, must, type ToolContext } from "./define";

/**
 * Delivery prices per wilaya. They are money, so a change takes the two-step
 * confirm. The database recomputes order totals from these rows; nothing here
 * touches orders.
 */

const DZD = z.number().int().min(0).max(1_000_000);

function listZones(server: McpServer, ctx: ToolContext) {
  defineTool(server, ctx, {
    name: "list_delivery_prices",
    title: "List delivery prices",
    kind: "read",
    description:
      "Delivery prices per wilaya in dinar: fee (to the home), stopdesk_fee (pickup at the carrier's office, null means not offered), eta_days, is_active.",
    input: z.object({ wilaya: z.string().optional().describe("Only this wilaya, exact name.") }),
    run: async ({ wilaya }) => {
      let query = ctx.db
        .from("delivery_zones")
        .select("wilaya, fee, stopdesk_fee, eta_days, is_active")
        .order("wilaya");
      if (wilaya) query = query.eq("wilaya", wilaya);
      const rows = must(await query);
      return { text: `${rows.length} wilaya(s).`, data: rows };
    },
  });
}

const ZONE = z.object({
  wilaya: z.string().min(2).describe("Exact name as list_delivery_prices shows it."),
  fee: DZD.optional(),
  stopdesk_fee: DZD.nullable().optional(),
  eta_days: z.number().int().min(1).max(30).optional(),
  is_active: z.boolean().optional().describe("false stops delivery to this wilaya."),
});

function updateZone(server: McpServer, ctx: ToolContext) {
  defineTool(server, ctx, {
    name: "update_delivery_price",
    title: "Change delivery prices",
    kind: "destructive",
    description:
      "Changes one wilaya's delivery prices, delay, or whether it is served. Orders already placed keep their fee.",
    input: ZONE,
    preview: async ({ wilaya, ...patch }) => {
      const row = maybe(
        await ctx.db.from("delivery_zones").select("*").eq("wilaya", wilaya).maybeSingle(),
      );
      if (!row) throw new Error(`No wilaya "${wilaya}". Use list_delivery_prices for exact names.`);
      const changes = Object.entries(patch).map(
        ([key, value]) => `${key} ${String(row[key as keyof typeof row])} to ${String(value)}`,
      );
      if (changes.length === 0) throw new Error("Nothing to change.");
      return { text: `${wilaya}: ${changes.join(", ")}.`, target: wilaya };
    },
    run: async ({ wilaya, ...patch }) => {
      const rows = must(
        await ctx.db.from("delivery_zones").update(patch).eq("wilaya", wilaya).select("wilaya"),
      );
      if (rows.length === 0) throw new Error("No such wilaya.");
      return { text: `${wilaya} delivery prices updated.`, target: wilaya };
    },
  });
}

export const deliveryTools = [listZones, updateZone];
