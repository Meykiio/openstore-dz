import { useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import {
  allImages,
  averageRating,
  sortVariants,
  useReviews,
  type CatalogueProduct,
} from "@/lib/queries";
import { StarRating } from "./star-rating";
import { ProductGallery } from "./product-gallery";
import { AddToCart, StockLine, VariantPicker } from "./product-purchase";

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
  const images = allImages(product);
  const stockable = variants.filter((v) => v.stock > 0);

  const [selectedId, setSelectedId] = useState<string | null>(
    stockable[0]?.id ?? variants[0]?.id ?? null,
  );
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const selected = useMemo(
    () => variants.find((v) => v.id === selectedId) ?? variants[0] ?? null,
    [variants, selectedId],
  );

  const rating = reviews ? averageRating(reviews) : null;
  const description =
    locale === "fr" && product.description_fr ? product.description_fr : product.description;
  const name = locale === "fr" && product.name_fr ? product.name_fr : product.name;

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <ProductGallery images={images} alt={name} active={activeImage} onSelect={setActiveImage} />

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

        <StockLine selected={selected} hasStock={stockable.length > 0} />

        <VariantPicker
          variants={variants}
          selectedId={selected?.id ?? null}
          onSelect={(id) => {
            setSelectedId(id);
            setQuantity(1);
          }}
        />

        {stockable.length > 0 && (
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
