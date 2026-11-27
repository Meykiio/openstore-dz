import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Banknote, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import {
  averageRating,
  sortVariants,
  useReviews,
  useStoreSettings,
  type CatalogueProduct,
} from "@/lib/queries";
import {
  colourOptions,
  findVariant,
  imagesForColour,
  initialChoice,
  sizeAfterColourChange,
  sizeOptions,
} from "@/lib/variant-options";
import { StarRating } from "./star-rating";
import { ProductGallery } from "./product-gallery";
import { AddToCart, StockLine } from "./product-purchase";
import { QuickOrder } from "./quick-order";
import { localized } from "@/lib/i18n";
import { ColourPicker, SizePicker } from "./variant-picker";

/**
 * Product page layout.
 *
 * Everything that performs an action lives in `product-purchase.tsx`; what is
 * left here is presentation and the state those controls share. The delivery
 * promises are read from settings rather than written into the markup, so they
 * cannot drift from what the shop actually offers.
 */
export function ProductDetail({ product }: { product: CatalogueProduct }) {
  const { t, locale } = useI18n();
  const { data: reviews } = useReviews(product.id);
  const { data: settings } = useStoreSettings();

  const variants = sortVariants(product.product_variants);
  const stockable = variants.filter((variant) => variant.stock > 0);

  const [choice, setChoice] = useState(() => initialChoice(variants));
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const colours = colourOptions(variants);
  const sizes = sizeOptions(variants, colours.length > 0 ? choice.colour : null);
  const selected = findVariant(variants, choice.colour, choice.size);
  const colourImages = imagesForColour(variants, choice.colour);
  const images = colourImages.length > 0 ? colourImages : imagesForColour(variants, null);

  const pickColour = (colour: string) => {
    setChoice({ colour, size: sizeAfterColourChange(variants, colour, choice.size) });
    setActiveImage(0);
    setQuantity(1);
  };
  const pickSize = (size: string) => {
    setChoice((current) => ({ ...current, size }));
    setQuantity(1);
  };

  const rating = reviews ? averageRating(reviews) : null;
  const description = product.description
    ? localized(locale, product.description, product.description_fr)
    : product.description_fr;
  const name = localized(locale, product.name, product.name_fr);
  const categoryName = product.categories
    ? localized(locale, product.categories.name, product.categories.name_fr)
    : null;

  return (
    <div className="flex flex-col gap-6">
      <ProductBreadcrumb product={product} name={name} categoryName={categoryName} />

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ProductGallery
            images={images}
            alt={choice.colour ? `${name} — ${choice.colour}` : name}
            active={activeImage}
            onSelect={setActiveImage}
          />
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            {categoryName && <span className="store-product-category">{categoryName}</span>}
            <h1 className="store-product-title">{name}</h1>
            {reviews && reviews.length > 0 && (
              <span className="flex items-center gap-2">
                <StarRating value={rating ?? 0} />
                <span className="text-sm text-on-surface-muted">
                  {t("reviews.count", { count: reviews.length })}
                </span>
              </span>
            )}
          </div>

          <StockLine selected={selected} hasStock={(selected?.stock ?? 0) > 0} />

          <ColourPicker colours={colours} selected={choice.colour} onSelect={pickColour} />
          <SizePicker sizes={sizes} selected={choice.size} onSelect={pickSize} />

          {stockable.length > 0 && selected && selected.stock > 0 && (
            <AddToCart
              product={product}
              name={name}
              selected={selected}
              images={images}
              quantity={quantity}
              setQuantity={setQuantity}
            />
          )}
          {selected && selected.stock > 0 && <QuickOrder selected={selected} quantity={quantity} />}

          <div className="store-delivery-card">
            <div>
              <Banknote size={16} aria-hidden="true" />
              {t("store.deliveryCod")}
            </div>
            <div>
              <Truck size={16} aria-hidden="true" />
              {t("store.deliveryNationwide")}
            </div>
            <div>
              <Truck size={16} aria-hidden="true" />
              {t("store.deliveryEta", { days: settings?.delivery_eta_days ?? 3 })}
            </div>
            <div>
              <RotateCcw size={16} aria-hidden="true" />
              {t("store.deliveryReturns", { days: settings?.returns_days ?? 14 })}
            </div>
          </div>

          {description && (
            <div className="flex flex-col gap-2 border-t border-outline pt-6">
              <h2 className="store-facet-title">{t("store.description")}</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-on-surface-muted">
                {description}
              </p>
            </div>
          )}

          <p className="flex items-start gap-2 border-t border-outline pt-5 text-xs leading-relaxed text-on-surface-muted">
            <ShieldCheck size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
            {t("checkout.codBody")}
          </p>
        </div>
      </div>
    </div>
  );
}

function ProductBreadcrumb({
  product,
  name,
  categoryName,
}: {
  product: CatalogueProduct;
  name: string;
  categoryName: string | null;
}) {
  const { t } = useI18n();
  return (
    <nav className="store-breadcrumb" aria-label={t("nav.shop")}>
      <Link to="/">{t("store.breadcrumbHome")}</Link>
      <span aria-hidden="true">/</span>
      <Link to="/catalogue">{t("store.breadcrumbShop")}</Link>
      {product.categories && categoryName && (
        <>
          <span aria-hidden="true">/</span>
          <Link to="/category/$slug" params={{ slug: product.categories.slug }}>
            {categoryName}
          </Link>
        </>
      )}
      <span aria-hidden="true">/</span>
      <span className="truncate text-on-surface" aria-current="page">
        {name}
      </span>
    </nav>
  );
}
