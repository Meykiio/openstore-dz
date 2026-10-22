import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { averageRating, sortVariants, useReviews, type CatalogueProduct } from "@/lib/queries";
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
import { localized } from "@/lib/i18n";
import { ColourPicker, SizePicker } from "./variant-picker";

/**
 * Product page layout.
 *
 * Everything that performs an action lives in `product-purchase.tsx`; what is
 * left here is presentation and the state those controls share.
 */
export function ProductDetail({ product }: { product: CatalogueProduct }) {
  const { t, locale } = useI18n();
  const { data: reviews } = useReviews(product.id);

  const variants = sortVariants(product.product_variants);
  const stockable = variants.filter((v) => v.stock > 0);

  const [choice, setChoice] = useState(() => initialChoice(variants));
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const colours = colourOptions(variants);
  const sizes = sizeOptions(variants, colours.length > 0 ? choice.colour : null);
  const selected = findVariant(variants, choice.colour, choice.size);
  // The gallery follows the colour. With no colour photos, fall back to all.
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

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <ProductGallery
        images={images}
        alt={choice.colour ? `${name} — ${choice.colour}` : name}
        active={activeImage}
        onSelect={setActiveImage}
      />

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">{name}</h1>
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

        {description && (
          <div className="flex flex-col gap-2 border-t border-outline pt-5">
            <h2 className="font-display text-base font-semibold">{t("store.description")}</h2>
            <p className="whitespace-pre-line text-sm text-on-surface-muted">{description}</p>
          </div>
        )}

        <p className="flex items-center gap-2 rounded-[10px] bg-surface-mid px-4 py-3 text-xs text-on-surface-muted">
          <ShieldCheck size={15} className="shrink-0 text-primary" aria-hidden="true" />
          {t("checkout.codBody")}
        </p>
      </div>
    </div>
  );
}
