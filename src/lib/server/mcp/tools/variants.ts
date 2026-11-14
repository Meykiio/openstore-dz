import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { defineTool, maybe, must, type ToolContext } from "./define";
import { productBySelector } from "./shape";

/**
 * Variants: one row per colour and size. Prices live here.
 * Adding variants may set their first price; changing an existing price is a
 * destructive tool (two steps), because buyers pay what this says.
 */

const id = z.string().uuid();
const HEX = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const PRICE = z.number().int().min(0).max(1_000_000).describe("Dinar, whole number.");

function addVariants(server: McpServer, ctx: ToolContext) {
  defineTool(server, ctx, {
    name: "add_variants",
    title: "Add colours and sizes",
    kind: "write",
    description:
      "Adds every combination of the given colours and sizes to a product, at one price. Stock defaults to 999 (made to order). Existing combinations are skipped.",
    input: z.object({
      product_id: id,
      colours: z
        .array(z.object({ name: z.string().trim().min(1).max(40), hex: HEX }))
        .min(1)
        .max(12),
      sizes: z.array(z.string().trim().min(1).max(12)).min(1).max(12),
      price: PRICE,
      stock: z.number().int().min(0).max(100_000).default(999),
    }),
    run: async ({ product_id, colours, sizes, price, stock }) => {
      const product = await productBySelector(ctx, product_id);
      const have = new Set(product.product_variants.map((v) => `${v.color_name}|${v.size}`));
      const start = product.product_variants.length;
      const rows = colours
        .flatMap((c) => sizes.map((size) => ({ c, size })))
        .filter(({ c, size }) => !have.has(`${c.name}|${size}`))
        .map(({ c, size }, i) => ({
          product_id,
          color_name: c.name,
          color_hex: c.hex,
          size,
          price,
          stock,
          sort_order: start + i,
          is_active: true,
        }));
      if (rows.length > 0) must(await ctx.db.from("product_variants").insert(rows));
      return {
        text: `Added ${rows.length} variant(s) to ${product.name}; ${colours.length * sizes.length - rows.length} already existed.`,
        target: product_id,
      };
    },
  });
}

function updateVariant(server: McpServer, ctx: ToolContext) {
  defineTool(server, ctx, {
    name: "update_variant",
    title: "Edit a variant",
    kind: "write",
    description:
      "Changes one variant's colour name, colour, size, stock or whether it is on sale (is_active). Not the price: use set_price.",
    input: z.object({
      variant_id: id,
      color_name: z.string().trim().min(1).max(40).optional(),
      color_hex: HEX.optional(),
      size: z.string().trim().min(1).max(12).optional(),
      stock: z.number().int().min(0).max(100_000).optional(),
      is_active: z.boolean().optional(),
    }),
    run: async ({ variant_id, ...patch }) => {
      if (Object.keys(patch).length === 0)
        return { text: "Nothing to change.", target: variant_id };
      const rows = must(
        await ctx.db.from("product_variants").update(patch).eq("id", variant_id).select("id"),
      );
      if (rows.length === 0) throw new Error("No such variant.");
      return { text: `Updated variant: ${Object.keys(patch).join(", ")}.`, target: variant_id };
    },
  });
}

const PRICE_INPUT = z.object({
  product_id: id,
  price: PRICE,
  compare_at_price: PRICE.nullable()
    .optional()
    .describe("Old price shown struck through, or null to remove it."),
  colour: z.string().optional().describe("Only this colour. Omit for all."),
  size: z.string().optional().describe("Only this size. Omit for all."),
});

type PriceArgs = z.infer<typeof PRICE_INPUT>;

async function matchingVariants(ctx: ToolContext, args: PriceArgs) {
  const product = await productBySelector(ctx, args.product_id);
  const hits = product.product_variants.filter(
    (v) => (!args.colour || v.color_name === args.colour) && (!args.size || v.size === args.size),
  );
  if (hits.length === 0) throw new Error("No variant matches that colour and size.");
  return { product, hits };
}

function setPrice(server: McpServer, ctx: ToolContext) {
  defineTool(server, ctx, {
    name: "set_price",
    title: "Change a price",
    kind: "destructive",
    description:
      "Changes what buyers pay for a product, or only for one colour or size. Orders already placed keep their price.",
    input: PRICE_INPUT,
    preview: async (args) => {
      const { product, hits } = await matchingVariants(ctx, args);
      const before = [...new Set(hits.map((v) => v.price))].join(" / ");
      return {
        text: `${product.name}: ${hits.length} variant(s) from ${before} DA to ${args.price} DA${args.compare_at_price ? ` (was ${args.compare_at_price} DA shown struck through)` : ""}.`,
        target: product.id,
      };
    },
    run: async (args) => {
      const { product, hits } = await matchingVariants(ctx, args);
      const patch: { price: number; compare_at_price?: number | null } = { price: args.price };
      if (args.compare_at_price !== undefined) patch.compare_at_price = args.compare_at_price;
      must(
        await ctx.db
          .from("product_variants")
          .update(patch)
          .in(
            "id",
            hits.map((v) => v.id),
          ),
      );
      return {
        text: `${product.name}: ${hits.length} variant(s) now ${args.price} DA.`,
        target: product.id,
      };
    },
  });
}

function deleteVariant(server: McpServer, ctx: ToolContext) {
  defineTool(server, ctx, {
    name: "delete_variant",
    title: "Delete a variant",
    kind: "destructive",
    description:
      "Deletes one colour and size of a product. To stop selling it for now, prefer update_variant is_active false.",
    input: z.object({ variant_id: id }),
    preview: async ({ variant_id }) => {
      const v = maybe(
        await ctx.db
          .from("product_variants")
          .select("color_name, size, price, products ( name )")
          .eq("id", variant_id)
          .maybeSingle(),
      );
      if (!v) throw new Error("No such variant.");
      return {
        text: `Delete ${v.products?.name ?? "product"} ${v.color_name ?? ""} ${v.size ?? ""} (${v.price} DA).`,
        target: variant_id,
      };
    },
    run: async ({ variant_id }) => {
      const gone = must(
        await ctx.db.from("product_variants").delete().eq("id", variant_id).select("id"),
      );
      if (gone.length === 0) throw new Error("No such variant.");
      return { text: "Variant deleted.", target: variant_id };
    },
  });
}

export const variantTools = [addVariants, updateVariant, setPrice, deleteVariant];
