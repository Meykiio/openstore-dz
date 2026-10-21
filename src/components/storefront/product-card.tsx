import { Link } from "@tanstack/react-router";
import { ImageOff } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { formatDzd } from "@/lib/format";
import {
  priceRange,
  sortVariants,
  productImage,
  totalStock,
  useReviews,
  type CatalogueProduct,
} from "@/lib/queries";
import { averageRating } from "@/lib/queries";
import { localized } from "@/lib/i18n";
import { saleOf } from "@/lib/sale";
import { StarRating } from "./star-rating";

/**
 * Catalogue card.
 *
 * Full-bleed 1:1 media, then a deliberately small text block: brand line, title,
 * rating, mono price, CTA. The thesis is that the photograph sells and the card
 * should not compete with it, so the only coloured element is the price.
 */
function ProductCard({ product }: { product: CatalogueProduct }) {
  const { t, locale } = useI18n();
  const { data: reviews } = useReviews(product.id);

  const image = productImage(product);
  const range = priceRange(product);
  // The cheapest variant sets the headline price, so its sale is the one shown.
  const cheapest = sortVariants(product.product_variants).find((v) => v.price === range?.min);
  const sale = cheapest ? saleOf(cheapest) : null;
  const stock = totalStock(product);
  const soldOut = stock <= 0;
  const rating = reviews ? averageRating(reviews) : null;
  // Display only, not a link: the whole card is already an anchor, and a nested
  // anchor is invalid HTML. Category navigation lives on the category pages and
  // the category strip.
  const category = product.categories
    ? localized(locale, product.categories.name, product.categories.name_fr)
    : undefined;

  return (
    <Link to="/product/$slug" params={{ slug: product.slug }} className="product-card">
      <div className="pc-media">
        {image ? (
          <img src={image} alt="" loading="lazy" decoding="async" />
        ) : (
          <ImageOff size={44} aria-hidden="true" />
        )}
        {soldOut ? <span className="pc-flag out">{t("store.outOfStock")}</span> : null}
      </div>

      <div className="pc-body">
        {category && <span className="pc-brand">{category}</span>}

        <h3 className="pc-title">{localized(locale, product.name, product.name_fr)}</h3>

        {rating !== null && reviews && reviews.length > 0 && (
          <span className="pc-rating">
            <StarRating value={rating} />
            <span className="rcount">({reviews.length})</span>
          </span>
        )}

        {range && (
          <span className="pc-price-row">
            <span className="pc-price" dir="ltr">
              {range.min === range.max
                ? formatDzd(range.min, locale)
                : `${t("store.from")} ${formatDzd(range.min, locale)}`}
            </span>
            {sale && (
              <>
                <span className="pc-price-old" dir="ltr">
                  {formatDzd(sale.was, locale)}
                </span>
                <span className="pc-price-save" dir="ltr">
                  −{sale.percent}%
                </span>
              </>
            )}
          </span>
        )}

        <span className="pc-cta">
          <span className="btn btn-secondary btn-sm btn-block">{t("store.viewDetails")}</span>
        </span>
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: CatalogueProduct[] }) {
  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
