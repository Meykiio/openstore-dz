import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ReviewItem } from "@/components/admin/review-item";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/feedback";
import { Pagination } from "@/components/ui/pagination";
import { useI18n } from "@/lib/i18n-context";
import {
  ADMIN_REVIEWS_KEY,
  deleteReview,
  setReviewApproval,
  useReviewCounts,
  useReviewsPage,
} from "@/lib/admin-reviews";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/reviews")({
  component: ReviewsPage,
});

function ReviewsPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [showApproved, setShowApproved] = useState(false);
  const [page, setPage] = useState(1);
  const reviews = useReviewsPage(showApproved, page);
  const counts = useReviewCounts();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: [ADMIN_REVIEWS_KEY] });
    // Public review lists and card ratings are cached separately.
    void queryClient.invalidateQueries({ queryKey: ["reviews"] });
    void queryClient.invalidateQueries({ queryKey: ["catalogue"] });
  };
  const onError = (mutationError: Error) => toast.error(mutationError.message);

  const approval = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      setReviewApproval(id, approved),
    onSuccess: invalidate,
    onError,
  });
  const removal = useMutation({ mutationFn: deleteReview, onSuccess: invalidate, onError });

  if (reviews.isPending) return <LoadingState />;
  if (reviews.isError) {
    return <ErrorState message={reviews.error.message} onRetry={() => void reviews.refetch()} />;
  }

  const tab = (approved: boolean, label: string, count: number | undefined) => (
    <button
      type="button"
      onClick={() => {
        setShowApproved(approved);
        setPage(1);
      }}
      aria-pressed={showApproved === approved}
      className={cn(
        "rounded-full px-4 py-2 text-sm",
        showApproved === approved ? "bg-primary text-on-primary" : "border border-outline",
      )}
    >
      {label}
      <span className="ms-2 font-mono text-xs">{count ?? "…"}</span>
    </button>
  );

  const list = reviews.data.rows;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold">{t("admin.reviews.title")}</h1>
        <div className="flex gap-2">
          {tab(false, t("admin.reviews.pending"), counts.data?.pending)}
          {tab(true, t("admin.reviews.approved"), counts.data?.approved)}
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState title={t("admin.reviews.empty")} />
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((review) => (
            <ReviewItem
              key={review.id}
              review={review}
              busy={approval.isPending || removal.isPending}
              onApprove={(approved) => approval.mutate({ id: review.id, approved })}
              onDelete={() => removal.mutate(review.id)}
            />
          ))}
        </ul>
      )}

      <Pagination
        page={page}
        pageCount={reviews.data.pageCount}
        onPageChange={setPage}
        testId="reviews-pagination"
      />
    </div>
  );
}
