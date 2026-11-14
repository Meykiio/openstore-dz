import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { defineTool, must, type ToolContext } from "./define";
import { productBySelector, type ProductRow } from "./shape";

/**
 * Product photos, per colour (every size of a colour shows the same photos).
 *
 * An image pasted in the Claude chat cannot reach a tool, so adding photos goes
 * through a one-time link: the owner opens it on the phone, picks the photos (or
 * the Google Drive file named here is fetched), and the page crops and resizes
 * them exactly like Admin > Products does.
 */

const id = z.string().uuid();
const BUCKET_MARKER = "/product-media/";

function coloursOf(product: ProductRow) {
  const byColour = new Map<string, { variantIds: string[]; urls: Map<string, number> }>();
  for (const v of product.product_variants) {
    const key = v.color_name ?? "";
    const entry = byColour.get(key) ?? { variantIds: [], urls: new Map<string, number>() };
    entry.variantIds.push(v.id);
    for (const img of v.variant_images) {
      if (!entry.urls.has(img.url)) entry.urls.set(img.url, img.sort_order);
    }
    byColour.set(key, entry);
  }
  return byColour;
}

function colourOf(product: ProductRow, colour: string) {
  const entry = coloursOf(product).get(colour);
  if (!entry) throw new Error(`${product.name} has no colour "${colour}".`);
  return entry;
}

function listImages(server: McpServer, ctx: ToolContext) {
  defineTool(server, ctx, {
    name: "list_images",
    title: "List product photos",
    kind: "read",
    description: "Lists a product's photos per colour, in display order (first = main photo).",
    input: z.object({ product: z.string().min(1).describe("Product id or slug.") }),
    run: async ({ product }) => {
      const row = await productBySelector(ctx, product);
      const data = [...coloursOf(row)].map(([colour, entry]) => ({
        colour,
        photos: [...entry.urls].sort((a, b) => a[1] - b[1]).map(([url]) => url),
      }));
      return { text: `Photos of ${row.name}.`, data, target: row.id };
    },
  });
}

function reorderImages(server: McpServer, ctx: ToolContext) {
  defineTool(server, ctx, {
    name: "reorder_images",
    title: "Reorder product photos",
    kind: "write",
    description:
      "Sets the display order of one colour's photos. Give every photo URL of that colour, first = main.",
    input: z.object({
      product_id: id,
      colour: z.string(),
      urls: z.array(z.string().url()).min(1).max(20),
    }),
    run: async ({ product_id, colour, urls }) => {
      const entry = colourOf(await productBySelector(ctx, product_id), colour);
      const unknown = urls.filter((url) => !entry.urls.has(url));
      if (unknown.length > 0) throw new Error(`Not photos of this colour: ${unknown.join(", ")}`);
      for (const [index, url] of urls.entries()) {
        must(
          await ctx.db
            .from("variant_images")
            .update({ sort_order: index })
            .in("variant_id", entry.variantIds)
            .eq("url", url),
        );
      }
      return { text: `Reordered ${urls.length} photo(s) of ${colour}.`, target: product_id };
    },
  });
}

function removeImage(server: McpServer, ctx: ToolContext) {
  defineTool(server, ctx, {
    name: "remove_image",
    title: "Remove a product photo",
    kind: "destructive",
    description:
      "Removes one photo from every size of a colour. The file is deleted once nothing else uses it.",
    input: z.object({ product_id: id, colour: z.string(), url: z.string().url() }),
    preview: async ({ product_id, colour, url }) => {
      const product = await productBySelector(ctx, product_id);
      const entry = colourOf(product, colour);
      if (!entry.urls.has(url)) throw new Error("That photo is not on this colour.");
      return {
        text: `Remove this photo from ${product.name} ${colour} (${entry.variantIds.length} size(s)): ${url}`,
        target: product_id,
      };
    },
    run: async ({ product_id, colour, url }) => {
      const entry = colourOf(await productBySelector(ctx, product_id), colour);
      must(
        await ctx.db
          .from("variant_images")
          .delete()
          .in("variant_id", entry.variantIds)
          .eq("url", url),
      );
      const left = await ctx.db
        .from("variant_images")
        .select("id", { count: "exact", head: true })
        .eq("url", url);
      const at = url.indexOf(BUCKET_MARKER);
      if (!left.error && (left.count ?? 0) === 0 && at !== -1) {
        // Best effort, like the admin: a leftover file costs nothing visible.
        await ctx.db.storage
          .from("product-media")
          .remove([decodeURIComponent(url.slice(at + BUCKET_MARKER.length))]);
      }
      return { text: `Photo removed from ${colour}.`, target: product_id };
    },
  });
}

const DRIVE = z
  .string()
  .regex(/^https:\/\/(drive|docs)\.google\.com\//, "Only Google Drive links.")
  .max(500);

function startUpload(server: McpServer, ctx: ToolContext) {
  defineTool(server, ctx, {
    name: "start_photo_upload",
    title: "Get a photo upload link",
    kind: "write",
    description:
      "Returns a one-time link (15 minutes) for adding photos to one colour of a product. Give the link to the owner: they open it on their phone and pick photos, or, if drive_url is given, the page imports that Google Drive file (it must be shared 'Anyone with the link'). Photos are cropped to 4:5 and resized like in the admin. Images pasted in this chat cannot be passed to tools, so always use this.",
    input: z.object({ product_id: id, colour: z.string().min(1), drive_url: DRIVE.optional() }),
    run: async ({ product_id, colour, drive_url }) => {
      const product = await productBySelector(ctx, product_id);
      colourOf(product, colour);
      const code = must(
        await ctx.db.rpc("ai_upload_create", {
          p_product_id: product_id,
          p_color: colour,
          p_drive_url: drive_url ?? null,
        }),
      );
      const link = `${ctx.origin}/admin/upload/${code}`;
      return {
        text: `Open this link to add photos to ${product.name} ${colour} (valid 15 minutes, once): ${link}`,
        target: product_id,
      };
    },
  });
}

export const photoTools = [listImages, reorderImages, removeImage, startUpload];
