import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { StarRating } from "@/components/storefront/star-rating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/feedback";
import { useI18n } from "@/lib/i18n-context";
import { formatRelative } from "@/lib/format";
import { deleteReview, setReviewApproval, useAdminReviews } from "@/lib/admin";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/reviews")({
  component: ReviewsPage,
});

function ReviewsPage() {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const { data: reviews, isPending, isError, error, refetch } = useAdminReviews();
  const [showApproved, setShowApproved] = useState(false);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin_reviews"] });
    // Public review lists are cached separately, so they must be dropped too.
    void queryClient.invalidateQueries({ queryKey: ["reviews"] });
  };

  const approval = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      setReviewApproval(id, approved),
    onSuccess: invalidate,
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const removal = useMutation({
    mutationFn: (id: string) => deleteReview(id),
    onSuccess: invalidate,
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  if (isPending) return <LoadingState />;
  if (isError) return <ErrorState message={error.message} onRetry={() => void refetch()} />;

  const all = reviews ?? [];
  const pending = all.filter((review) => !review.is_approved);
  const visible = showApproved ? all : pending;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold">{t("admin.reviews.title")}</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowApproved(false)}
            className={cn(
              "rounded-full px-4 py-2 text-sm",
              !showApproved ? "bg-primary text-on-primary" : "border border-outline",
            )}
          >
            {t("admin.reviews.pending")}
            <span className="ms-2 font-mono text-xs">{pending.length}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowApproved(true)}
            className={cn(
              "rounded-full px-4 py-2 text-sm",
              showApproved ? "bg-primary text-on-primary" : "border border-outline",
            )}
          >
            {t("admin.reviews.approved")}
            <span className="ms-2 font-mono text-xs">{all.length}</span>
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState title={t("admin.reviews.empty")} />
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((review) => (
            <li
              key={review.id}
              className="flex flex-col gap-3 rounded-[16px] border border-outline bg-surface p-4"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <p className="font-medium">{review.customer_name}</p>
                <StarRating value={review.rating} />
                {review.is_approved ? (
                  <Badge tone="positive">{t("admin.reviews.approved")}</Badge>
                ) : (
                  <Badge tone="warning">{t("reviews.awaitingModeration")}</Badge>
                )}
                <span className="text-xs text-on-surface-muted">
                  {formatRelative(review.created_at, locale)}
                </span>
              </div>

              {review.products && (
                <p className="text-xs text-on-surface-muted">{review.products.name}</p>
              )}

              <p className="whitespace-pre-line text-sm text-on-surface-muted">{review.comment}</p>

              <div className="flex flex-wrap gap-2">
                {review.is_approved ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={approval.isPending}
                    onClick={() => approval.mutate({ id: review.id, approved: false })}
                  >
                    <X size={15} aria-hidden="true" />
                    {t("admin.products.unpublish")}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={approval.isPending}
                    onClick={() => approval.mutate({ id: review.id, approved: true })}
                  >
                    <Check size={15} aria-hidden="true" />
                    {t("admin.reviews.approve")}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={removal.isPending}
                  onClick={() => removal.mutate(review.id)}
                  className="text-error"
                >
                  <Trash2 size={15} aria-hidden="true" />
                  {t("common.delete")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
