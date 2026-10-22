import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getSupabase } from "./supabase/client";

/**
 * Review moderation, a page at a time.
 *
 * This used to read the newest 200 reviews and filter them in the browser, so a
 * shop past 200 reviews silently lost the oldest ones from moderation. Now the
 * database filters and pages, and both tab counts are real totals.
 */
export type AdminReview = {
  id: string;
  product_id: string | null;
  customer_name: string;
  rating: number;
  comment: string;
  image_url: string | null;
  is_approved: boolean;
  created_at: string;
  products: { name: string; slug: string } | null;
};

const PAGE_SIZE = 15;
export const ADMIN_REVIEWS_KEY = "admin_reviews";

async function fetchReviewsPage(approved: boolean, page: number) {
  const from = (Math.max(page, 1) - 1) * PAGE_SIZE;
  const { data, error, count } = await getSupabase()
    .from("reviews")
    .select(
      "id, product_id, customer_name, rating, comment, image_url, is_approved, created_at, products ( name, slug )",
      { count: "exact" },
    )
    .eq("is_approved", approved)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  if (error) throw new Error(error.message);
  const total = count ?? 0;
  return {
    rows: (data ?? []) as unknown as AdminReview[],
    total,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export function useReviewsPage(approved: boolean, page: number) {
  return useQuery({
    queryKey: [ADMIN_REVIEWS_KEY, approved, page] as const,
    queryFn: () => fetchReviewsPage(approved, page),
    placeholderData: keepPreviousData,
  });
}

async function countReviews(approved: boolean): Promise<number> {
  const { count, error } = await getSupabase()
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("is_approved", approved);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export function useReviewCounts() {
  return useQuery({
    queryKey: [ADMIN_REVIEWS_KEY, "counts"] as const,
    queryFn: async () => ({
      pending: await countReviews(false),
      approved: await countReviews(true),
    }),
  });
}

export async function setReviewApproval(id: string, approved: boolean): Promise<void> {
  const { error } = await getSupabase()
    .from("reviews")
    .update({ is_approved: approved })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteReview(id: string): Promise<void> {
  const { error } = await getSupabase().from("reviews").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
