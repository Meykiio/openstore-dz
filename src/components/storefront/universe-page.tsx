import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n-context";
import { entryLabel } from "@/lib/universe-sections";
import {
  buildUniverse,
  findEntry,
  matchesEntry,
  productFacets,
  universeConfig,
  type UniverseCatalog,
  type UniverseKey,
} from "@/lib/universes";
import { ErrorState, ProductSkeleton } from "@/components/ui/feedback";
import { useUniverseFeed } from "@/lib/universe-feed";
import { ProductGrid } from "./product-card";
import { UniverseFacets } from "./universe-facets";
import { CrossUniverses, UniverseHero } from "./universe-hero";

/** A universe page body: hero, shelves, pieces, cross-links. */
export function UniversePage({ universe }: { universe: UniverseKey }) {
  const { t, locale } = useI18n();
  const config = universeConfig(universe);
  const feed = useUniverseFeed();
  const [selection, setSelection] = useState<string | null>(null);

  const catalog = useMemo(() => buildUniverse(feed.data ?? [], universe), [feed.data, universe]);

  const entry = useMemo(
    () => (selection ? findEntry(catalog, selection) : null),
    [catalog, selection],
  );

  const filtered = useMemo(() => {
    if (!entry) return catalog.members;
    return catalog.members.filter((product) =>
      matchesEntry(product, productFacets(product), entry),
    );
  }, [catalog.members, entry]);

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

  const selectionLabel = entry ? entryLabel(entry, locale, t) : null;

  return (
    <div>
      <UniverseHero catalog={catalog} universe={universe} />

      <UniverseFacets
        catalog={catalog}
        selection={selection}
        onSelect={(value) => setSelection(value)}
      />

      {catalog.members.length === 0 && !entry ? (
        <div className="container-page">
          <div className="store-universe-empty">
            <div className="flex justify-center">
              <p className="store-eyebrow">{config.index}</p>
            </div>
            <h2>{t("universe.empty.title")}</h2>
            <p>{t("universe.empty.body")}</p>
            <Link to="/catalogue" className="store-btn store-btn--fill">
              {t("universe.empty.cta")}
            </Link>
          </div>
        </div>
      ) : (
        <PiecesSection
          filtered={filtered}
          selectionLabel={selectionLabel}
          hasSelection={Boolean(entry)}
          onClear={() => setSelection(null)}
        />
      )}

      <div className="container-page">
        <CrossUniverses universe={universe} />
      </div>
    </div>
  );
}

function PiecesSection({
  filtered,
  selectionLabel,
  hasSelection,
  onClear,
}: {
  filtered: UniverseCatalog["members"];
  selectionLabel: string | null;
  hasSelection: boolean;
  onClear: () => void;
}) {
  const { t } = useI18n();
  return (
    <section
      id="pieces"
      className="container-page scroll-mt-24 py-12"
      aria-label={t("universe.piecesAria")}
    >
      <div className="store-section-head">
        <div>
          <p className="store-eyebrow">{t("universe.eyebrow")}</p>
          <h2 className="store-section-title">{selectionLabel ?? t("universe.allPieces")}</h2>
          <p className="store-section-lede">{t("universe.count", { count: filtered.length })}</p>
        </div>
        {hasSelection && (
          <button
            type="button"
            className="store-btn store-btn--sm store-btn--ghost"
            onClick={onClear}
          >
            {t("universe.filterClear")}
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="store-universe-empty">
          <h2>{t("universe.noMatch")}</h2>
          <p>{t("universe.noMatchBody")}</p>
          <button type="button" className="store-btn store-btn--fill" onClick={onClear}>
            {t("universe.filterClear")}
          </button>
        </div>
      ) : (
        <ProductGrid products={filtered} />
      )}
    </section>
  );
}
