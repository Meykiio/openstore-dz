import { Link } from "@tanstack/react-router";
import { Quote } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { formatRelative } from "@/lib/format";
import { useReviews } from "@/lib/queries";
import { StarRating } from "./star-rating";

/**
 * Shop bulletin.
 *
 * The four promises the shop actually keeps, repeated in an ink band. It is the
 * only moving element on the page, so it stays slow and stops entirely under
 * prefers-reduced-motion. Hidden from assistive tech: the trust bar says the
 * same things in reading order, and a screen reader should not hear them twice.
 */
export function Ticker({ returnsDays }: { returnsDays: number }) {
  const { t } = useI18n();
  const items = [
    t("home.ticker.delivery"),
    t("home.ticker.cod"),
    t("home.ticker.returns", { days: returnsDays }),
    t("home.ticker.noAccount"),
  ];
  // Six copies: two halves for a seamless -50% loop, wide enough on a desktop.
  const run = Array.from({ length: 6 }, () => items).flat();

  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker-track">
        {run.map((item, index) => (
          <span key={index} className="ticker-item">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Promo band. Oxblood, because it is the one colour in the system and this is
 * the one place on the page that asks for a decision.
 */
export function PromoBand({ threshold }: { threshold: number }) {
  const { t, locale } = useI18n();
  if (threshold <= 0) return null;

  const formatted = new Intl.NumberFormat("en-US").format(threshold);

  return (
    <section className="container-page py-7">
      <div className="promo-bar">
        <span className="p-text">
          {t("home.promo.title")} —{" "}
          <span dir="ltr" className="font-mono font-semibold">
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
        <div className="mb-8 flex flex-col gap-2 sm:mb-10">
          <h2 className="section-title text-xl sm:text-2xl">{t("home.reviews.title")}</h2>
          <p className="max-w-lg text-sm text-on-surface-muted">{t("home.reviews.body")}</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {top.map((review) => (
            <figure key={review.id} className="review-card">
              <Quote size={18} className="mb-3 text-secondary" aria-hidden="true" />
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
      <div className="flex flex-col items-center gap-4 rounded-[2px] border border-outline bg-surface px-6 py-12 text-center">
        <h2 className="section-title text-xl sm:text-2xl">{t("home.cta.title")}</h2>
        <p className="max-w-md text-sm text-on-surface-muted">{t("home.cta.body")}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/catalogue" className="btn btn-primary btn-lg">
            {t("home.browseAll")}
          </Link>
          <Link to="/track" className="btn btn-secondary btn-lg">
            {t("nav.trackOrder")}
          </Link>
        </div>
        <p className="mt-2 font-mono text-[11px] text-on-surface-muted">{storeName}</p>
      </div>
    </section>
  );
}
