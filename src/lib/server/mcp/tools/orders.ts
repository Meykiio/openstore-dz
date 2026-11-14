import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { defineTool, must, type ToolContext } from "./define";
import { BUYER_TEXT_NOTE } from "./shape";

/**
 * Orders. Totals are never written here: the database computes them, and the
 * column grants on `orders` exclude every money column anyway.
 */

const STATUS = z.enum([
  "pending",
  "confirmed",
  "refused",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
]);

const SELECT = `id, public_token, created_at, status, wilaya, delivery_method, stopdesk_name,
  subtotal, delivery_fee, total, confirmed_at, refused_at, refused_reason,
  carrier, tracking_number, tracking_url, phone, customer_name, commune, address, note,
  order_items ( product_name, variant_label, quantity, unit_price )`;

type OrderRow = Record<string, unknown> & {
  id: string;
  public_token: string;
  customer_name: string;
  commune: string | null;
  address: string;
  note: string | null;
};

/** Buyer-typed fields go in their own box, labelled, so they read as data. */
function shape(row: OrderRow) {
  // The full token is the buyer's private tracking link; only its first part,
  // the reference printed on labels, is shown.
  const { customer_name, commune, address, note, public_token, ...rest } = row;
  return {
    reference: ref(row),
    ...rest,
    untrusted_buyer_text: { customer_name, commune, address, note },
  };
}

/** The order number on labels and in the sheet: the token's first 8 characters. */
const ref = (row: { public_token: string }) => row.public_token.slice(0, 8).toUpperCase();

function listOrders(server: McpServer, ctx: ToolContext) {
  defineTool(server, ctx, {
    name: "list_orders",
    title: "List orders",
    kind: "read",
    description: `Lists orders, newest first, with reference, lines, totals in dinar and the buyer's phone. Filter by status, wilaya or a start date. ${BUYER_TEXT_NOTE}`,
    input: z.object({
      status: STATUS.optional(),
      wilaya: z.string().optional(),
      since: z.string().date().optional().describe("YYYY-MM-DD, orders placed on or after."),
      limit: z.number().int().min(1).max(50).default(20),
    }),
    run: async ({ status, wilaya, since, limit }) => {
      let query = ctx.db.from("orders").select(SELECT).order("created_at", { ascending: false });
      if (status) query = query.eq("status", status);
      if (wilaya) query = query.eq("wilaya", wilaya);
      if (since) query = query.gte("created_at", since);
      const rows = must(await query.limit(limit)) as unknown as OrderRow[];
      return { text: `${rows.length} order(s). ${BUYER_TEXT_NOTE}`, data: rows.map(shape) };
    },
  });
}

/**
 * An order by its id or by its 8-character reference. A reference is the start
 * of a uuid, so it becomes a range on the token rather than a text search.
 */
async function findOrder(ctx: ToolContext, given: string): Promise<OrderRow> {
  const clean = given.trim().toLowerCase().replace(/^#/, "");
  const query = ctx.db.from("orders").select(SELECT);
  let rows: OrderRow[];
  if (/^[0-9a-f-]{36}$/.test(clean)) {
    rows = must(await query.eq("id", clean).limit(2)) as unknown as OrderRow[];
  } else if (/^[0-9a-f]{8}$/.test(clean)) {
    rows = must(
      await query
        .gte("public_token", `${clean}-0000-0000-0000-000000000000`)
        .lte("public_token", `${clean}-ffff-ffff-ffff-ffffffffffff`)
        .limit(2),
    ) as unknown as OrderRow[];
  } else {
    throw new Error("Give the order's 8-character reference (as on the label) or its id.");
  }
  if (rows.length === 0) throw new Error(`No order "${given}".`);
  if (rows.length > 1) throw new Error(`"${given}" matches several orders; use the id.`);
  return rows[0];
}

function getOrder(server: McpServer, ctx: ToolContext) {
  defineTool(server, ctx, {
    name: "get_order",
    title: "Show one order",
    kind: "read",
    description: `Shows one order by its 8-character reference (as on the shipping label) or its id. ${BUYER_TEXT_NOTE}`,
    input: z.object({ order: z.string().min(6) }),
    run: async ({ order }) => {
      const row = await findOrder(ctx, order);
      return { text: `Order ${ref(row)}. ${BUYER_TEXT_NOTE}`, data: shape(row), target: row.id };
    },
  });
}

function setStatus(server: McpServer, ctx: ToolContext) {
  defineTool(server, ctx, {
    name: "set_order_status",
    title: "Change an order's status",
    kind: "write",
    description:
      "Moves an order along: confirmed (after the phone call), refused (with a reason), shipped, delivered, cancelled, returned, or back to pending.",
    input: z.object({
      order: z.string().min(6),
      status: STATUS,
      reason: z.string().max(200).optional(),
    }),
    run: async ({ order, status, reason }) => {
      const row = await findOrder(ctx, order);
      const now = new Date().toISOString();
      const extra =
        status === "confirmed"
          ? { confirmed_at: now, refused_at: null, refused_reason: null }
          : status === "refused"
            ? { refused_at: now, refused_reason: reason ?? null }
            : status === "shipped"
              ? { shipped_at: now }
              : status === "delivered"
                ? { delivered_at: now }
                : {};
      must(
        await ctx.db
          .from("orders")
          .update({ status, ...extra })
          .eq("id", row.id),
      );
      return { text: `Order ${ref(row)} is now ${status}.`, target: row.id };
    },
  });
}

function setTracking(server: McpServer, ctx: ToolContext) {
  defineTool(server, ctx, {
    name: "set_order_tracking",
    title: "Add tracking to an order",
    kind: "write",
    description:
      "Saves the carrier, tracking number and tracking link on an order. The buyer sees them on the tracking page.",
    input: z.object({
      order: z.string().min(6),
      carrier: z.string().trim().max(40).optional(),
      tracking_number: z.string().trim().max(60).optional(),
      tracking_url: z.string().url().startsWith("https://").max(300).optional(),
    }),
    run: async ({ order, ...patch }) => {
      const row = await findOrder(ctx, order);
      if (Object.keys(patch).length === 0) return { text: "Nothing to change.", target: row.id };
      must(await ctx.db.from("orders").update(patch).eq("id", row.id));
      return { text: `Tracking saved on order ${ref(row)}.`, target: row.id };
    },
  });
}

function deleteOrder(server: McpServer, ctx: ToolContext) {
  defineTool(server, ctx, {
    name: "delete_order",
    title: "Delete an order",
    kind: "destructive",
    description:
      "Deletes an order and its lines, for test orders and duplicates. A real order the buyer turned down should be set to refused instead, so it stays on record.",
    input: z.object({ order: z.string().min(6) }),
    preview: async ({ order }) => {
      const row = await findOrder(ctx, order);
      return {
        text: `Delete order ${ref(row)} (${String(row.status)}, ${String(row.wilaya)}, ${String(row.total)} DA, placed ${String(row.created_at).slice(0, 10)}).`,
        target: row.id,
      };
    },
    run: async ({ order }) => {
      const row = await findOrder(ctx, order);
      const gone = must(await ctx.db.from("orders").delete().eq("id", row.id).select("id"));
      if (gone.length === 0) throw new Error("The order could not be deleted.");
      return { text: `Order ${ref(row)} deleted.`, target: row.id };
    },
  });
}

export const orderTools = [listOrders, getOrder, setStatus, setTracking, deleteOrder];
