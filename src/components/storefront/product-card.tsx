import { Link } from "@tanstack/react-router";
import { ImageOff } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { formatDzd } from "@/lib/format";
import {
  priceRange,
  sortVariants,
  productImage,
  productSecondImage,
  totalStock,
  type CatalogueProduct,
} from "@/lib/queries";
import { localized } from "@/lib/i18n";
import { saleOf } from "@/lib/sale";
import { StarRating } from "./star-rating";

/**
 * Catalogue card.
 *
 * A photograph on the page, then four lines of type. No frame, no surface, no
 * button: the whole card is the link, and the only chrome is a sale tag or a
 * sold-out band when one applies. The second photo crossfades on hover, which
 * shows the cut or the back of the garment without opening the product.
 */
function ProductCard({ product }: { product: CatalogueProduct }) {
  const { t, locale } = useI18n();

  const image = productImage(product);
  const secondImage = productSecondImage(product);
  const range = priceRange(product);
  // The cheapest variant sets the headline price, so its sale is the one shown.
  const cheapest = sortVariants(product.product_variants).find((v) => v.price === range?.min);
  const sale = cheapest ? saleOf(cheapest) : null;
  const stock = totalStock(product);
  const soldOut = stock <= 0;
  const rating = product.rating_avg ?? null;
  const ratingCount = product.rating_count ?? 0;
  // Display only, not a link: the whole card is already an anchor, and a nested
  // anchor is invalid HTML.
  const category = product.categories
    ? localized(locale, product.categories.name, product.categories.name_fr)
    : undefined;
  const name = localized(locale, product.name, product.name_fr);

  return (
    <Link to="/product/$slug" params={{ slug: product.slug }} className="product-card">
      <div className="pc-media">
        {image ? (
          <>
            {/* The card's own title is the accessible name; a second copy of it
                in the image alt would be read twice inside the same link. */}
            <img src={image} alt="" loading="lazy" decoding="async" />
            {secondImage && secondImage !== image && (
              <img
                className="pc-alt"
                src={secondImage}
                alt=""
                loading="lazy"
                decoding="async"
                aria-hidden="true"
              />
            )}
          </>
        ) : (
          <ImageOff size={44} aria-hidden="true" />
        )}
        {sale && !soldOut && (
          <span className="pc-flag sale" dir="ltr">
            −{sale.percent}%
          </span>
        )}
        {soldOut && <span className="pc-flag out">{t("store.outOfStock")}</span>}
      </div>

      <div className="pc-body">
        {category && <span className="pc-brand">{category}</span>}

        <h3 className="pc-title">{name}</h3>

        {rating !== null && ratingCount > 0 && (
          <span className="pc-rating">
            <StarRating value={rating} />
            <span className="rcount">({ratingCount})</span>
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
              <span className="pc-price-old" dir="ltr">
                {formatDzd(sale.was, locale)}
              </span>
            )}
          </span>
        )}
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
