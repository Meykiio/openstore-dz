import { useMemo, type CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { ErrorState, ProductSkeleton } from "@/components/ui/feedback";
import { useI18n } from "@/lib/i18n-context";
import { productImage } from "@/lib/queries";
import { useUniverseFeed } from "@/lib/universe-feed";
import { productFacets } from "@/lib/product-facets";
import { SERIES } from "@/lib/universe-series";
import { ANIME_COLLECTIONS } from "@/lib/universe-sections";
import { labelFor } from "@/lib/universe-taxonomy";
import { universeConfig } from "@/lib/universes";
import { ProductGrid } from "./product-card";
import { CrossUniverses } from "./universe-hero";

/**
 * One Anime collection's catalogue.
 *
 * Only pieces filed under this series are shown; the shelves of the other eight
 * collections are one chip away, and the back link always returns to the
 * collections grid. The hero photograph is the first real product photo of the
 * series, never a stock image.
 */
export function AnimeCollectionPage({ seriesKey }: { seriesKey: string }) {
  const { t, locale } = useI18n();
  const feed = useUniverseFeed();
  const config = universeConfig("anime");
  const series = SERIES.find((entry) => entry.key === seriesKey);

  const products = useMemo(
    () =>
      (feed.data ?? []).filter((product) => {
        const facets = productFacets(product);
        return facets.universes.includes("anime") && facets.series.includes(seriesKey);
      }),
    [feed.data, seriesKey],
  );

  if (!series) return null;

  if (feed.isPending && !feed.data) {
    return (
      <div className="container-page py-16">
        <div className="product-grid">
          {Array.from({ length: 8 }, (_, index) => (
            <ProductSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (feed.isError) {
    return (
      <div className="container-page py-16">
        <div className="mx-auto flex max-w-xl flex-col gap-4">
          <ErrorState message={feed.error.message} onRetry={() => void feed.refetch()} />
        </div>
      </div>
    );
  }

  const position = ANIME_COLLECTIONS.indexOf(seriesKey as (typeof ANIME_COLLECTIONS)[number]) + 1;
  const index = String(position).padStart(2, "0");
  const image = products.map((product) => productImage(product)).find(Boolean) ?? null;

  return (
    <div>
      <section
        className="store-universe-hero"
        style={{ "--u-accent": config.accent } as CSSProperties}
      >
        <div className="store-universe-hero-inner container-page">
          <div className="store-universe-hero-copy">
            <Link to="/anime" className="store-back-link">
              <ArrowLeft size={15} aria-hidden="true" />
              {t("universe.anime.backToCollections")}
            </Link>
            <p className="store-eyebrow">
              {config.index} — {t("universe.anime.kicker")}
            </p>
            <h1 className="store-universe-title">{labelFor(series, locale)}</h1>
            <p className="store-universe-intro">
              {t("universe.count", { count: products.length })}
            </p>
          </div>

          <div className="store-universe-hero-media">
            {image ? (
              <img src={image} alt="" loading="eager" fetchPriority="high" decoding="async" />
            ) : (
              <div className="store-hero-fallback">
                <strong>{index}</strong>
                <span>{t("home.hero.fallback")}</span>
              </div>
            )}
            <span className="u-mark">ANIME — {index}</span>
          </div>
        </div>
      </section>

      <section
        id="pieces"
        className="container-page scroll-mt-24 py-12"
        aria-label={t("universe.piecesAria")}
      >
        {products.length === 0 ? (
          <div className="store-universe-empty">
            <h2>{t("universe.collectionEmptyTitle")}</h2>
            <p>{t("universe.collectionEmptyBody")}</p>
            <Link to="/anime" className="store-btn store-btn--fill">
              {t("universe.anime.backToCollections")}
            </Link>
          </div>
        ) : (
          <ProductGrid products={products} />
        )}
      </section>

      <nav className="container-page pb-12" aria-label={t("universe.series")}>
        <p className="store-eyebrow">{t("universe.series")}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {ANIME_COLLECTIONS.filter((key) => key !== seriesKey).map((key) => {
            const entry = SERIES.find((item) => item.key === key);
            if (!entry) return null;
            return (
              <Link key={key} to="/anime/$series" params={{ series: key }} className="store-chip">
                {labelFor(entry, locale)}
                <ArrowUpRight size={12} aria-hidden="true" />
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="container-page">
        <CrossUniverses universe="anime" />
      </div>
    </div>
  );
}
