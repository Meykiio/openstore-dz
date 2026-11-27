import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Pause, Play, Quote } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { formatDzd, formatRelative } from "@/lib/format";
import { useReviews } from "@/lib/queries";
import { StarRating } from "./star-rating";

/**
 * Shop bulletin.
 *
 * The four promises the shop actually keeps, repeated in an ink band. It is the
 * only continuously moving element on the page, so it stays slow and stops
 * entirely under prefers-reduced-motion. Hidden from assistive tech: the trust
 * bar says the same things in reading order.
 */
export function Ticker({ returnsDays }: { returnsDays: number }) {
  const { t } = useI18n();
  const [paused, setPaused] = useState(false);
  const items = [
    t("home.ticker.delivery"),
    t("home.ticker.cod"),
    t("home.ticker.returns", { days: returnsDays }),
    t("home.ticker.noAccount"),
  ];
  const run = Array.from({ length: 6 }, () => items).flat();

  return (
    // The strip is decorative for assistive tech, so the pause control is a
    // sibling rather than a child: a control inside `aria-hidden` would be
    // unreachable. WCAG 2.2.2 asks for exactly this on moving content.
    <div className="ticker-shell" data-paused={paused || undefined}>
      <div className="ticker" aria-hidden="true">
        <div className="ticker-track">
          {run.map((item, index) => (
            <span key={index} className="ticker-item">
              {item}
            </span>
          ))}
        </div>
      </div>
      <button
        type="button"
        className="ticker-pause"
        onClick={() => setPaused((value) => !value)}
        aria-pressed={paused}
        aria-label={paused ? t("home.ticker.resume") : t("home.ticker.pause")}
      >
        {paused ? <Play size={11} aria-hidden="true" /> : <Pause size={11} aria-hidden="true" />}
      </button>
    </div>
  );
}

/** The one decision band on the page, in the system's acid accent. */
export function PromoBand({ threshold }: { threshold: number }) {
  const { t, locale } = useI18n();
  if (threshold <= 0) return null;

  return (
    <section className="store-promo">
      <div className="container-page store-promo-inner">
        <div>
          <h2 className="store-promo-title">{t("home.promo.title")}</h2>
          <p className="store-promo-body">
            {t("home.promo.threshold", { amount: formatDzd(threshold, locale) })} ·{" "}
            {t("home.promo.body")}
          </p>
        </div>
        <Link to="/catalogue" className="store-btn store-btn--fill">
          {t("home.promo.cta")}
          <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
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
    <section className="store-section">
      <div className="container-page">
        <div className="store-section-head">
          <div>
            <p className="store-eyebrow">{t("home.reviews.eyebrow")}</p>
            <h2 className="store-section-title">{t("home.reviews.title")}</h2>
            <p className="store-section-lede">{t("home.reviews.body")}</p>
          </div>
        </div>

        <div className="store-review-grid">
          {top.map((review) => (
            <figure key={review.id} className="store-review-card">
              <Quote size={18} aria-hidden="true" />
              <StarRating value={review.rating} />
              <blockquote>{review.comment}</blockquote>
              <figcaption>
                <span className="flex items-center gap-2.5">
                  <span className="ava" aria-hidden="true">
                    {review.customer_name.trim().charAt(0)}
                  </span>
                  <span>
                    <span className="block font-medium">{review.customer_name}</span>
                    <span className="text-on-surface-muted">
                      {formatRelative(review.created_at, locale)}
                    </span>
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
    <section className="store-closing">
      <div className="container-page">
        <div className="flex justify-center">
          <p className="store-eyebrow">{t("home.cta.eyebrow")}</p>
        </div>
        <h2>{t("home.cta.title")}</h2>
        <p className="store-section-lede mx-auto">{t("home.cta.body")}</p>
        <div className="store-closing-actions">
          <Link to="/catalogue" className="store-btn store-btn--fill">
            {t("home.browseAll")}
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
          <Link to="/track" className="store-btn store-btn--ghost">
            {t("nav.trackOrder")}
          </Link>
        </div>
        <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.2em] text-on-surface-muted">
          {storeName}
        </p>
      </div>
    </section>
  );
}
