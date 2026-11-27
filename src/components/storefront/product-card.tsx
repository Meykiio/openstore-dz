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

const NEW_FOR_DAYS = 30;

/**
 * Catalogue card.
 *
 * A photograph, then the product's own facts: category, name, available
 * colours, price. The whole card is the link, so there is no nested button to
 * fight with the anchor. Sale and new flags are printed labels rather than
 * floating pills, and the second photo crossfades on hover to show the cut or
 * the back without opening the product.
 */
function ProductCard({ product }: { product: CatalogueProduct }) {
  const { t, locale } = useI18n();

  const image = productImage(product);
  const secondImage = productSecondImage(product);
  const range = priceRange(product);
  const variants = sortVariants(product.product_variants);
  const cheapest = variants.find((variant) => variant.price === range?.min);
  const sale = cheapest ? saleOf(cheapest) : null;
  const stock = totalStock(product);
  const soldOut = stock <= 0;
  const rating = product.rating_avg ?? null;
  const ratingCount = product.rating_count ?? 0;
  const isNew = product.published_at
    ? Date.now() - new Date(product.published_at).getTime() < NEW_FOR_DAYS * 86_400_000
    : false;

  const category = product.categories
    ? localized(locale, product.categories.name, product.categories.name_fr)
    : undefined;
  const name = localized(locale, product.name, product.name_fr);

  const colours: { name: string; hex: string | null }[] = [];
  for (const variant of variants) {
    if (!variant.color_name) continue;
    if (colours.some((colour) => colour.name === variant.color_name)) continue;
    colours.push({ name: variant.color_name, hex: variant.color_hex });
  }

  return (
    <Link to="/product/$slug" params={{ slug: product.slug }} className="product-card">
      <div className="pc-media">
        {image ? (
          <>
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
        {isNew && !soldOut && (
          <span className="pc-flag new" dir="ltr">
            {t("store.new")}
          </span>
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

        {colours.length > 0 && (
          <span className="pc-colours" aria-hidden="true">
            {colours.slice(0, 4).map((colour) => (
              <span
                key={colour.name}
                className="pc-colour"
                style={{ background: colour.hex ?? "var(--surface-highest)" }}
              />
            ))}
            {colours.length > 4 && <span className="pc-colour-more">+{colours.length - 4}</span>}
          </span>
        )}

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
