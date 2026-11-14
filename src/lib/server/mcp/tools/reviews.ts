import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { defineTool, maybe, must, type ToolContext } from "./define";
import { BUYER_TEXT_NOTE } from "./shape";

/** Reviews: buyers write them, the owner approves before they show. */

const id = z.string().uuid();

type ReviewRow = {
  id: string;
  rating: number;
  is_approved: boolean;
  created_at: string;
  customer_name: string;
  comment: string;
  products: { name: string } | null;
};

const shape = ({ customer_name, comment, products, ...rest }: ReviewRow) => ({
  ...rest,
  product: products?.name ?? null,
  untrusted_buyer_text: { customer_name, comment },
});

function listReviews(server: McpServer, ctx: ToolContext) {
  defineTool(server, ctx, {
    name: "list_reviews",
    title: "List reviews",
    kind: "read",
    description: `Lists reviews, newest first: waiting for approval (default) or already shown. ${BUYER_TEXT_NOTE}`,
    input: z.object({
      approved: z.boolean().default(false),
      limit: z.number().int().min(1).max(50).default(20),
    }),
    run: async ({ approved, limit }) => {
      const rows = must(
        await ctx.db
          .from("reviews")
          .select("id, rating, is_approved, created_at, customer_name, comment, products ( name )")
          .eq("is_approved", approved)
          .order("created_at", { ascending: false })
          .limit(limit),
      ) as unknown as ReviewRow[];
      return { text: `${rows.length} review(s). ${BUYER_TEXT_NOTE}`, data: rows.map(shape) };
    },
  });
}

function approveReview(server: McpServer, ctx: ToolContext) {
  defineTool(server, ctx, {
    name: "approve_review",
    title: "Show or hide a review",
    kind: "write",
    description: "approved true shows the review on the product page; false hides it again.",
    input: z.object({ review_id: id, approved: z.boolean() }),
    run: async ({ review_id, approved }) => {
      const rows = must(
        await ctx.db
          .from("reviews")
          .update({ is_approved: approved })
          .eq("id", review_id)
          .select("id"),
      );
      if (rows.length === 0) throw new Error("No such review.");
      return { text: approved ? "Review shown." : "Review hidden.", target: review_id };
    },
  });
}

function deleteReview(server: McpServer, ctx: ToolContext) {
  defineTool(server, ctx, {
    name: "delete_review",
    title: "Delete a review",
    kind: "destructive",
    description: "Deletes a review for good. To only hide it, use approve_review approved false.",
    input: z.object({ review_id: id }),
    preview: async ({ review_id }) => {
      const row = maybe(
        await ctx.db.from("reviews").select("rating, created_at").eq("id", review_id).maybeSingle(),
      );
      if (!row) throw new Error("No such review.");
      return {
        text: `Delete a ${row.rating}-star review from ${row.created_at.slice(0, 10)}.`,
        target: review_id,
      };
    },
    run: async ({ review_id }) => {
      const gone = must(await ctx.db.from("reviews").delete().eq("id", review_id).select("id"));
      if (gone.length === 0) throw new Error("No such review.");
      return { text: "Review deleted.", target: review_id };
    },
  });
}

export const reviewTools = [listReviews, approveReview, deleteReview];
