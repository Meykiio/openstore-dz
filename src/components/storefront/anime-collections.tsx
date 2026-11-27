import { useMemo, type CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n-context";
import { productImage, type CatalogueProduct } from "@/lib/queries";
import { SERIES } from "@/lib/universe-series";
import { ANIME_COLLECTIONS } from "@/lib/universe-sections";
import { labelFor } from "@/lib/universe-taxonomy";
import { productFacets } from "@/lib/product-facets";
import { universeConfig } from "@/lib/universes";
import { cn } from "@/lib/utils";

/**
 * The Anime collections grid.
 *
 * Collection first: the Anime page opens on the nine series, each a card with a
 * photograph from the catalogue when one exists and a typographic panel when it
 * does not, never a stock image. A collection with nothing in stock still keeps
 * its card and says zero, because the structure is a promise to the buyer.
 */
export function AnimeCollectionsGrid({ products }: { products: CatalogueProduct[] }) {
  const { t, locale } = useI18n();
  const accent = universeConfig("anime").accent;

  const cards = useMemo(() => {
    const facets = new Map(products.map((product) => [product.id, productFacets(product)]));
    return ANIME_COLLECTIONS.flatMap((key, index) => {
      const named = SERIES.find((series) => series.key === key);
      if (!named) return [];
      const members = products.filter((product) => {
        const facetsOf = facets.get(product.id);
        return facetsOf?.universes.includes("anime") && facetsOf.series.includes(key);
      });
      const image =
        members
          .map((product) => productImage(product))
          .find((value): value is string => Boolean(value)) ?? null;
      return [{ key, named, index, count: members.length, image }];
    });
  }, [products]);

  return (
    <div className="anime-collection-grid">
      {cards.map((card) => (
        <Link
          key={card.key}
          to="/anime/$series"
          params={{ series: card.key }}
          className={cn("store-collection-card anime-collection-card", card.image && "has-image")}
          style={{ "--u-accent": accent } as CSSProperties}
        >
          {card.image && <img src={card.image} alt="" loading="lazy" decoding="async" />}
          <span className="c-index" dir="ltr">
            {String(card.index + 1).padStart(2, "0")}
          </span>
          <span className="c-count">{t("home.collections.pieces", { count: card.count })}</span>
          <span className="c-name">{labelFor(card.named, locale)}</span>
        </Link>
      ))}
    </div>
  );
}
