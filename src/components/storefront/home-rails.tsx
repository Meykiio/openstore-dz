import type { CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { localized } from "@/lib/i18n";
import { productImage, type CatalogueProduct } from "@/lib/queries";
import { UNIVERSES, universesOf, type UniverseKey } from "@/lib/universes";
import { ProductGrid } from "./product-card";

/**
 * Homepage rails.
 *
 * One shelf is a doorway, not a listing: a heading, a line of context and one
 * row of products. The catalogue is where the whole range lives. A shelf with
 * nothing to show renders nothing rather than an empty heading.
 */
export function ProductRail({
  id,
  eyebrow,
  title,
  body,
  products,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  body?: string;
  products: CatalogueProduct[];
}) {
  const { t } = useI18n();
  if (products.length === 0) return null;

  return (
    <section id={id} className="store-section scroll-mt-24">
      <div className="container-page">
        <div className="store-section-head">
          <div>
            <p className="store-eyebrow">{eyebrow}</p>
            <h2 className="store-section-title">{title}</h2>
            {body && <p className="store-section-lede">{body}</p>}
          </div>
          <Link to="/catalogue" className="store-link-arrow">
            {t("home.viewAll")}
            <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </div>
        <ProductGrid products={products} />
      </div>
    </section>
  );
}

export type CollectionItem = {
  id: string;
  slug: string;
  name: string;
  name_fr: string | null;
  image_url: string | null;
  image?: string | null;
  count: number;
};

/** Category doorways, using the category image or its first product photo. */
export function CollectionGrid({ collections }: { collections: CollectionItem[] }) {
  const { t, locale } = useI18n();
  if (collections.length === 0) return null;

  return (
    <section className="store-section">
      <div className="container-page">
        <div className="store-section-head">
          <div>
            <p className="store-eyebrow">{t("home.collections.eyebrow")}</p>
            <h2 className="store-section-title">{t("home.collections.title")}</h2>
            <p className="store-section-lede">{t("home.collections.body")}</p>
          </div>
          <Link to="/catalogue" className="store-link-arrow">
            {t("home.viewAll")}
            <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </div>

        <div className="store-collection-grid">
          {collections.map((collection) => {
            const image = collection.image ?? collection.image_url;
            return (
              <Link
                key={collection.id}
                to="/category/$slug"
                params={{ slug: collection.slug }}
                className={`store-collection-card ${image ? "has-image" : ""}`}
              >
                {image && <img src={image} alt="" loading="lazy" decoding="async" />}
                <span className="c-count">
                  {t("home.collections.pieces", { count: collection.count })}
                </span>
                <span className="c-name">
                  {localized(locale, collection.name, collection.name_fr)}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** The four universes, each using the first piece the catalogue can answer. */
export function UniverseGrid({ products }: { products: CatalogueProduct[] }) {
  const { t } = useI18n();

  const members = (key: UniverseKey) =>
    products.filter((product) => universesOf(product).includes(key));
  const imageFor = (key: UniverseKey) => {
    const withImage = members(key)
      .map((product) => productImage(product))
      .find((image): image is string => Boolean(image));
    return withImage ?? null;
  };

  return (
    <section id="universes" className="store-section scroll-mt-24">
      <div className="container-page">
        <div className="store-section-head">
          <div>
            <p className="store-eyebrow">{t("home.universes.eyebrow")}</p>
            <h2 className="store-section-title">{t("home.universes.title")}</h2>
            <p className="store-section-lede">{t("home.universes.body")}</p>
          </div>
        </div>

        <div className="store-universe-grid">
          {UNIVERSES.map((universe) => {
            const image = imageFor(universe.key);
            return (
              <Link
                key={universe.key}
                to={universe.to}
                className="store-universe-card"
                style={{ "--u-accent": universe.accent } as CSSProperties}
              >
                {image && <img src={image} alt="" loading="lazy" decoding="async" />}
                <span className="u-index">{universe.index}</span>
                <span className="u-kicker">{t(universe.kickerKey)}</span>
                <span className="u-title">{t(universe.labelKey)}</span>
                <span className="u-body">{t(universe.bodyKey)}</span>
                <span className="u-link">
                  {t("home.universes.enter")}
                  <ArrowUpRight size={14} aria-hidden="true" />
                </span>
                <span className="u-line" aria-hidden="true" />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
