import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { MessageSquareQuote } from "lucide-react";
import { getSupabase } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n-context";
import { formatRelative, initials } from "@/lib/format";
import { useReviews } from "@/lib/queries";
import { StarRating, StarRatingInput } from "./star-rating";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { EmptyState, LoadingState } from "@/components/ui/feedback";

export function ReviewList({ productId }: { productId: string }) {
  const { t, locale } = useI18n();
  const { data: reviews, isPending } = useReviews(productId);

  if (isPending) return <LoadingState />;
  if (!reviews || reviews.length === 0) {
    return <EmptyState title={t("reviews.empty")} icon={<MessageSquareQuote size={28} />} />;
  }

  return (
    <ul className="flex flex-col gap-4">
      {reviews.map((review) => (
        <li key={review.id} className="rounded-[16px] border border-outline bg-surface p-4">
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-mid text-xs font-semibold text-on-surface"
            >
              {initials(review.customer_name)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <p className="text-sm font-medium">{review.customer_name}</p>
                <StarRating value={review.rating} />
                <span className="text-xs text-on-surface-muted">
                  {formatRelative(review.created_at, locale)}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm text-on-surface-muted">
                {review.comment}
              </p>
              {review.image_url && (
                <img
                  src={review.image_url}
                  alt=""
                  loading="lazy"
                  className="mt-3 max-h-40 rounded-[10px] object-cover"
                />
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

type FormState = { name: string; rating: number; comment: string };

/**
 * Review submission.
 *
 * The row is inserted as an anonymous visitor, so RLS allows the INSERT and the
 * `validate_review` trigger forces `is_approved = false`. A submitted review
 * therefore cannot appear anywhere until the shop approves it, which is why this
 * component shows a thank-you rather than the new review.
 */
export function ReviewForm({ productId }: { productId: string }) {
  const { t } = useI18n();
  const [form, setForm] = useState<FormState>({ name: "", rating: 5, comment: "" });
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: async (payload: FormState) => {
      const { error } = await getSupabase().from("reviews").insert({
        product_id: productId,
        customer_name: payload.name.trim(),
        rating: payload.rating,
        comment: payload.comment.trim(),
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => setDone(true),
  });

  if (done) {
    return (
      <div className="rounded-[16px] border border-positive/40 bg-positive/5 p-5">
        <p className="font-medium text-positive">{t("reviews.thanks")}</p>
        <p className="mt-1 text-sm text-on-surface-muted">{t("reviews.thanksBody")}</p>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-4 rounded-[16px] border border-outline bg-surface p-5"
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate(form);
      }}
    >
      <p className="font-medium">{t("reviews.write")}</p>

      <Field label={t("reviews.yourName")} required>
        <Input
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          required
          minLength={2}
          maxLength={120}
          autoComplete="name"
        />
      </Field>

      <StarRatingInput
        name="rating"
        label={t("reviews.rating")}
        value={form.rating}
        onChange={(rating) => setForm({ ...form, rating })}
      />

      <Field label={t("reviews.comment")} required>
        <Textarea
          value={form.comment}
          onChange={(event) => setForm({ ...form, comment: event.target.value })}
          required
          minLength={3}
          maxLength={2000}
        />
      </Field>

      {mutation.isError && (
        <p className="text-sm text-error" role="alert">
          {mutation.error.message}
        </p>
      )}

      <Button type="submit" disabled={mutation.isPending} className="self-start">
        {mutation.isPending ? t("common.saving") : t("reviews.submit")}
      </Button>
    </form>
  );
}
