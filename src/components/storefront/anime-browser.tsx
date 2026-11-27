import { useMemo } from "react";
import { ErrorState, ProductSkeleton } from "@/components/ui/feedback";
import { useI18n } from "@/lib/i18n-context";
import { useUniverseFeed } from "@/lib/universe-feed";
import { productFacets } from "@/lib/product-facets";
import { ANIME_COLLECTIONS } from "@/lib/universe-sections";
import { buildUniverse } from "@/lib/universes";
import { AnimeCollectionsGrid } from "./anime-collections";
import { ProductRail } from "./home-rails";
import { CrossUniverses, UniverseHero } from "./universe-hero";

/**
 * The Anime universe, collection first.
 *
 * The page leads with the nine collections; the pieces live one level down, on
 * each collection's own catalogue. Pieces from a series the grid does not
 * promote stay reachable through the "Other anime" rail rather than becoming
 * orphans.
 */
export function AnimeBrowser() {
  const { t } = useI18n();
  const feed = useUniverseFeed();

  const catalog = useMemo(() => buildUniverse(feed.data ?? [], "anime"), [feed.data]);
  const otherPieces = useMemo(
    () =>
      catalog.members.filter((product) => {
        const facets = productFacets(product);
        return !facets.series.some((key) => (ANIME_COLLECTIONS as readonly string[]).includes(key));
      }),
    [catalog.members],
  );

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

  return (
    <div>
      <UniverseHero catalog={catalog} universe="anime" ctaKey="universe.anime.viewCollections" />

      <section
        id="pieces"
        className="container-page scroll-mt-24 py-12"
        aria-label={t("universe.anime.collectionsTitle")}
      >
        <div className="store-section-head">
          <div>
            <p className="store-eyebrow">{t("universe.anime.collectionsEyebrow")}</p>
            <h2 className="store-section-title">{t("universe.anime.collectionsTitle")}</h2>
            <p className="store-section-lede">{t("universe.anime.collectionsBody")}</p>
          </div>
        </div>

        <AnimeCollectionsGrid products={catalog.members} />
      </section>

      {otherPieces.length > 0 && (
        <ProductRail
          eyebrow={t("universe.eyebrow")}
          title={t("universe.otherAnime")}
          products={otherPieces}
        />
      )}

      <div className="container-page">
        <CrossUniverses universe="anime" />
      </div>
    </div>
  );
}
