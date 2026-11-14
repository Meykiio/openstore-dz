import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { defineTool, maybe, must, type ToolContext } from "./define";

/** Categories: the chips on the home page and the /category pages. */

const id = z.string().uuid();
const SLUG = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  .max(60);

function listCategories(server: McpServer, ctx: ToolContext) {
  defineTool(server, ctx, {
    name: "list_categories",
    title: "List categories",
    kind: "read",
    description: "Lists categories with their product counts, order and whether they show.",
    input: z.object({}),
    run: async () => {
      const rows = must(
        await ctx.db
          .from("categories")
          .select("id, slug, name, name_fr, sort_order, is_active, products(count)")
          .order("sort_order"),
      );
      return { text: `${rows.length} categor(ies).`, data: rows };
    },
  });
}

function createCategory(server: McpServer, ctx: ToolContext) {
  defineTool(server, ctx, {
    name: "create_category",
    title: "Create a category",
    kind: "write",
    description: "Creates a category. Assign products to it with update_product.",
    input: z.object({
      name: z.string().trim().min(1).max(60).describe("Arabic name."),
      name_fr: z.string().trim().max(60).optional(),
      slug: SLUG.describe("Web address part, e.g. robes."),
      sort_order: z.number().int().min(0).max(999).default(0),
    }),
    run: async (args) => {
      const row = must(
        await ctx.db
          .from("categories")
          .insert({ ...args, name_fr: args.name_fr ?? null, is_active: true })
          .select("id")
          .single(),
      );
      return { text: `Created category ${args.name} (/category/${args.slug}).`, target: row.id };
    },
  });
}

function updateCategory(server: McpServer, ctx: ToolContext) {
  defineTool(server, ctx, {
    name: "update_category",
    title: "Edit a category",
    kind: "write",
    description: "Renames, reorders, shows or hides a category.",
    input: z.object({
      category_id: id,
      name: z.string().trim().min(1).max(60).optional(),
      name_fr: z.string().trim().max(60).nullable().optional(),
      sort_order: z.number().int().min(0).max(999).optional(),
      is_active: z.boolean().optional(),
    }),
    run: async ({ category_id, ...patch }) => {
      if (Object.keys(patch).length === 0)
        return { text: "Nothing to change.", target: category_id };
      const rows = must(
        await ctx.db.from("categories").update(patch).eq("id", category_id).select("id"),
      );
      if (rows.length === 0) throw new Error("No such category.");
      return { text: `Updated category: ${Object.keys(patch).join(", ")}.`, target: category_id };
    },
  });
}

function deleteCategory(server: McpServer, ctx: ToolContext) {
  defineTool(server, ctx, {
    name: "delete_category",
    title: "Delete a category",
    kind: "destructive",
    description: "Deletes a category. Its products stay, without a category.",
    input: z.object({ category_id: id }),
    preview: async ({ category_id }) => {
      const row = maybe(
        await ctx.db
          .from("categories")
          .select("name, products(count)")
          .eq("id", category_id)
          .maybeSingle(),
      );
      if (!row) throw new Error("No such category.");
      const count = (row.products as unknown as { count: number }[])[0]?.count ?? 0;
      return {
        text: `Delete category "${row.name}". ${count} product(s) will have no category.`,
        target: category_id,
      };
    },
    run: async ({ category_id }) => {
      const gone = must(
        await ctx.db.from("categories").delete().eq("id", category_id).select("name"),
      );
      if (gone.length === 0) throw new Error("No such category.");
      return { text: `Deleted category ${gone[0].name}.`, target: category_id };
    },
  });
}

export const categoryTools = [listCategories, createCategory, updateCategory, deleteCategory];
