import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { defineTool, must, type ToolContext } from "./define";
import type { Database } from "../../../supabase/types";
import {
  findCategoryId,
  productBySelector,
  PRODUCT_SELECT,
  summariseProduct,
  type ProductRow,
} from "./shape";

/** Products: list, read, create, edit, publish, delete. Prices live on variants. */

const STATUS = z.enum(["draft", "published", "archived"]);
const id = z.string().uuid();

function listProducts(server: McpServer, ctx: ToolContext) {
  defineTool(server, ctx, {
    name: "list_products",
    title: "List products",
    kind: "read",
    description:
      "Lists the shop's products with status, category, colours, sizes and price range. Drafts and archived products included.",
    input: z.object({ status: STATUS.optional().describe("Only this status.") }),
    run: async ({ status }) => {
      let query = ctx.db
        .from("products")
        .select(PRODUCT_SELECT)
        .order("created_at", { ascending: false });
      if (status) query = query.eq("status", status);
      const rows = must(await query.limit(100)) as unknown as ProductRow[];
      return { text: `${rows.length} product(s).`, data: rows.map(summariseProduct) };
    },
  });
}

function getProduct(server: McpServer, ctx: ToolContext) {
  defineTool(server, ctx, {
    name: "get_product",
    title: "Show one product",
    kind: "read",
    description:
      "Shows one product in full: texts in Arabic and French, every variant (id, colour, size, price, stock) and photos per colour. Give the id or the slug.",
    input: z.object({ product: z.string().min(1).describe("Product id or slug.") }),
    run: async ({ product }) => {
      const row = await productBySelector(ctx, product);
      return { text: `Product ${row.name}.`, data: row, target: row.id };
    },
  });
}

function createProduct(server: McpServer, ctx: ToolContext) {
  defineTool(server, ctx, {
    name: "create_product",
    title: "Create a product",
    kind: "write",
    description:
      "Creates a product as a draft (hidden from buyers). Then add colours and sizes with add_variants, photos with start_photo_upload, and publish with update_product.",
    input: z.object({
      name: z
        .string()
        .trim()
        .min(2)
        .max(120)
        .describe("Name in Arabic (the shop's main language)."),
      name_fr: z.string().trim().max(120).optional().describe("Name in French/Latin letters."),
      description: z.string().trim().max(4000).optional(),
      description_fr: z.string().trim().max(4000).optional(),
      slug: z
        .string()
        .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
        .max(80)
        .describe("Web address part, e.g. robe-kabyle. Lowercase, digits and dashes."),
      category: z.string().optional().describe("Category id or slug."),
    }),
    run: async (args) => {
      const categoryId = args.category ? await findCategoryId(ctx, args.category) : null;
      const row = must(
        await ctx.db
          .from("products")
          .insert({
            name: args.name,
            name_fr: args.name_fr ?? null,
            description: args.description ?? null,
            description_fr: args.description_fr ?? null,
            slug: args.slug,
            kind: "single",
            status: "draft",
            category_id: categoryId,
          })
          .select("id, slug")
          .single(),
      );
      return {
        text: `Created draft product ${args.name} (/${row.slug}).`,
        data: row,
        target: row.id,
      };
    },
  });
}

function updateProduct(server: McpServer, ctx: ToolContext) {
  defineTool(server, ctx, {
    name: "update_product",
    title: "Edit or publish a product",
    kind: "write",
    description:
      "Changes a product's names, descriptions, category or status. status 'published' shows it to buyers, 'draft' hides it, 'archived' retires it. Prices are changed with set_price.",
    input: z.object({
      product_id: id,
      name: z.string().trim().min(2).max(120).optional(),
      name_fr: z.string().trim().max(120).nullable().optional(),
      description: z.string().trim().max(4000).nullable().optional(),
      description_fr: z.string().trim().max(4000).nullable().optional(),
      category: z.string().nullable().optional().describe("Category id or slug, or null for none."),
      status: STATUS.optional(),
    }),
    run: async ({ product_id, category, status, ...texts }) => {
      const current = must(
        await ctx.db.from("products").select("name, published_at").eq("id", product_id).single(),
      );
      const patch: Database["public"]["Tables"]["products"]["Update"] = { ...texts };
      if (category !== undefined)
        patch.category_id = category ? await findCategoryId(ctx, category) : null;
      if (status) {
        patch.status = status;
        // Stamped on first publish only, so republishing does not reorder the shop.
        if (status === "published" && !current.published_at)
          patch.published_at = new Date().toISOString();
      }
      if (Object.keys(patch).length === 0)
        return { text: "Nothing to change.", target: product_id };
      must(await ctx.db.from("products").update(patch).eq("id", product_id));
      return {
        text: `Updated ${texts.name ?? current.name}: ${Object.keys(patch).join(", ")}.`,
        target: product_id,
      };
    },
  });
}

function deleteProduct(server: McpServer, ctx: ToolContext) {
  defineTool(server, ctx, {
    name: "delete_product",
    title: "Delete a product",
    kind: "destructive",
    description:
      "Deletes a product with all its variants and photo links. Past orders keep their own copy of name and price. Prefer update_product status 'archived' to only hide it.",
    input: z.object({ product_id: id }),
    preview: async ({ product_id }) => {
      const row = await productBySelector(ctx, product_id);
      const s = summariseProduct(row);
      return {
        text: `Delete product "${row.name}" (${row.status}), ${s.variants} variant(s), ${s.photos} photo link(s).`,
        target: product_id,
      };
    },
    run: async ({ product_id }) => {
      const gone = must(await ctx.db.from("products").delete().eq("id", product_id).select("name"));
      if (gone.length === 0) throw new Error("No such product.");
      return { text: `Deleted product ${gone[0].name}.`, target: product_id };
    },
  });
}

export const productTools = [listProducts, getProduct, createProduct, updateProduct, deleteProduct];
