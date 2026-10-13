import { Link } from "@tanstack/react-router";
import { ArrowRight, Quote } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { formatRelative } from "@/lib/format";
import { useCategories, useReviews } from "@/lib/queries";
import { StarRating } from "./star-rating";
import { cn } from "@/lib/utils";

/**
 * Category strip.
 *
 * Real links to real category pages, built from the categories table rather than
 * derived from whatever text happens to be on products. A category with no
 * published products is not rendered, because an empty category page is a dead
 * end and makes a small shop look broken.
 */
export function CategoryStrip() {
  const { t } = useI18n();
  const { data: categories } = useCategories();

  const visible = (categories ?? []).filter((category) => category.product_count > 0);
  if (visible.length === 0) return null;

  return (
    <section className="container-page py-10">
      <h2 className="mb-5 font-display text-xl font-semibold sm:text-2xl">
        {t("home.categories")}
      </h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map((category) => (
          <Link
            key={category.id}
            to="/category/$slug"
            params={{ slug: category.slug }}
            className="group flex items-center justify-between gap-3 rounded-[16px] border border-outline bg-surface transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-outline-hi hover:shadow-sm"
          >
            {category.image_url && (
              <span className="size-16 shrink-0 overflow-hidden rounded-s-[16px] bg-surface-high">
                <img
                  src={category.image_url}
                  alt=""
                  loading="lazy"
                  className="size-full object-cover"
                />
              </span>
            )}
            <span className="min-w-0 flex-1 px-4 py-3.5">
              <span className="block truncate text-sm font-medium">{category.name}</span>
              <span className="font-mono text-xs text-on-surface-muted">
                {category.product_count} {t("nav.products")}
              </span>
            </span>
            <ArrowRight
              size={16}
              className="me-4 shrink-0 text-on-surface-muted transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
              aria-hidden="true"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}

/**
 * Promo band. Berry, per the reference's "sale/secondary action" colour, so it
 * reads as a time-limited offer rather than as another primary button.
 */
export function PromoBand({ threshold }: { threshold: number }) {
  const { t, locale } = useI18n();
  if (threshold <= 0) return null;

  const formatted = new Intl.NumberFormat("en-US").format(threshold);

  return (
    <section className="container-page py-6">
      <div className="promo-bar">
        <span className="p-text">
          {t("home.promo.title")} -{" "}
          <span dir="ltr" className="font-mono">
            {formatted}
          </span>{" "}
          {locale === "ar" ? "دج" : "DA"}
        </span>
        <span className="p-text opacity-90">{t("home.promo.body")}</span>
        <a href="#catalogue" className="promo-cta">
          {t("home.promo.cta")}
        </a>
      </div>
    </section>
  );
}

/** Review wall, from the store's own approved reviews. */
export function ReviewWall() {
  const { t, locale } = useI18n();
  const { data: reviews } = useReviews();
  const top = (reviews ?? []).slice(0, 3);

  if (top.length === 0) return null;

  return (
    <section className="section-alt border-y border-outline py-14">
      <div className="container-page">
        <div className="mb-8 flex flex-col items-center text-center">
          <h2 className="font-display text-xl font-semibold sm:text-2xl">
            {t("home.reviews.title")}
          </h2>
          <p className="mt-2 max-w-lg text-sm text-on-surface-muted">{t("home.reviews.body")}</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {top.map((review) => (
            <figure key={review.id} className="review-card">
              <Quote size={18} className="mb-3 text-outline-hi" aria-hidden="true" />
              <StarRating value={review.rating} className="mb-3" />
              <blockquote className="review-body">{review.comment}</blockquote>
              <figcaption className="mt-4 flex items-center gap-2.5">
                <span className="review-ava" aria-hidden="true">
                  {review.customer_name.trim().charAt(0)}
                </span>
                <span>
                  <span className="block text-sm font-medium">{review.customer_name}</span>
                  <span className="text-xs text-on-surface-muted">
                    {formatRelative(review.created_at, locale)}
                  </span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Closing call to action. */
export function ClosingCta({ storeName }: { storeName: string }) {
  const { t } = useI18n();
  return (
    <section className="container-page py-14">
      <div
        className={cn(
          "flex flex-col items-center gap-4 rounded-[24px] border border-outline bg-surface px-6 py-12 text-center",
        )}
      >
        <h2 className="font-display text-xl font-semibold sm:text-2xl">{t("home.cta.title")}</h2>
        <p className="max-w-md text-sm text-on-surface-muted">{t("home.cta.body")}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <a href="#catalogue" className="btn btn-primary btn-lg">
            {t("home.browseAll")}
          </a>
          <Link to="/track" className="btn btn-secondary btn-lg">
            {t("nav.trackOrder")}
          </Link>
        </div>
        <p className="mt-2 text-xs text-on-surface-muted">{storeName}</p>
      </div>
    </section>
  );
}
