import { Check, Trash2, X } from "lucide-react";
import { StarRating } from "@/components/storefront/star-rating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n-context";
import { formatRelative } from "@/lib/format";
import type { AdminReview } from "@/lib/admin-reviews";

/** One review in the moderation list, with approve or unpublish, and delete. */
export function ReviewItem({
  review,
  busy,
  onApprove,
  onDelete,
}: {
  review: AdminReview;
  busy: boolean;
  onApprove: (approved: boolean) => void;
  onDelete: () => void;
}) {
  const { t, locale } = useI18n();
  return (
    <li className="flex flex-col gap-3 rounded-[16px] border border-outline bg-surface p-4">
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

      {review.products && <p className="text-xs text-on-surface-muted">{review.products.name}</p>}

      <p className="whitespace-pre-line text-sm text-on-surface-muted">{review.comment}</p>

      <div className="flex flex-wrap gap-2">
        {review.is_approved ? (
          <Button variant="outline" size="sm" disabled={busy} onClick={() => onApprove(false)}>
            <X size={15} aria-hidden="true" />
            {t("admin.products.unpublish")}
          </Button>
        ) : (
          <Button size="sm" disabled={busy} onClick={() => onApprove(true)}>
            <Check size={15} aria-hidden="true" />
            {t("admin.reviews.approve")}
          </Button>
        )}
        <Button variant="ghost" size="sm" disabled={busy} onClick={onDelete} className="text-error">
          <Trash2 size={15} aria-hidden="true" />
          {t("common.delete")}
        </Button>
      </div>
    </li>
  );
}
