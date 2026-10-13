import { useMemo, useState } from "react";
import { Check, Package, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { formatDzd } from "@/lib/format";
import {
  allImages,
  averageRating,
  sortVariants,
  useReviews,
  type CatalogueProduct,
  type CatalogueVariant,
} from "@/lib/queries";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { StarRating } from "./star-rating";
import { ProductGallery } from "./product-gallery";
import { cn } from "@/lib/utils";

function variantLabel(variant: CatalogueVariant): string {
  const parts = [variant.size, variant.color_name].filter(Boolean);
  return parts.length > 0 ? parts.join(" / ") : "—";
}

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

function StockLine({
  selected,
  hasStock,
}: {
  selected: CatalogueVariant | null;
  hasStock: boolean;
}) {
  const { t, locale } = useI18n();
  const low = selected !== null && selected.stock > 0 && selected.stock <= 3;

  return (
    <div className="flex flex-col gap-2">
      {selected && (
        <p className="font-mono text-2xl font-semibold text-primary" dir="ltr">
          {formatDzd(selected.price, locale)}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        {hasStock ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-positive/12 px-3 py-1 text-positive">
            <Check size={14} aria-hidden="true" />
            {t("store.inStock")}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-error/12 px-3 py-1 text-error">
            {t("store.outOfStock")}
          </span>
        )}
        {low && selected && (
          <span className="text-xs text-tertiary">
            {t("store.lowStock", { count: selected.stock })}
          </span>
        )}
      </div>
    </div>
  );
}

function VariantPicker({
  variants,
  selectedId,
  onSelect,
}: {
  variants: CatalogueVariant[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { t } = useI18n();
  if (variants.length <= 1) return null;

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-xs font-semibold uppercase tracking-[0.03em] text-on-surface-muted">
        {t("store.selectVariant")}
      </legend>
      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => (
          <button
            key={variant.id}
            type="button"
            onClick={() => onSelect(variant.id)}
            disabled={variant.stock <= 0}
            aria-pressed={variant.id === selectedId}
            className={cn("chip", variant.id === selectedId && "filled")}
          >
            {variantLabel(variant)}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function AddToCart({
  product,
  name,
  selected,
  images,
  quantity,
  setQuantity,
}: {
  product: CatalogueProduct;
  name: string;
  selected: CatalogueVariant | null;
  images: string[];
  quantity: number;
  setQuantity: React.Dispatch<React.SetStateAction<number>>;
}) {
  const { t } = useI18n();
  const { add } = useCart();

  const handleAdd = () => {
    if (!selected) return;
    add(
      {
        variantId: selected.id,
        productId: product.id,
        slug: product.slug,
        name,
        variantLabel: variantLabel(selected),
        unitPrice: selected.price,
        imageUrl: images[0] ?? null,
      },
      quantity,
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="ci-qty !h-11">
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          aria-label={`${t("common.quantity")} −`}
        >
          −
        </button>
        <span className="q" aria-live="polite">
          {quantity}
        </span>
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.min(selected?.stock ?? 100, q + 1))}
          aria-label={`${t("common.quantity")} +`}
        >
          +
        </button>
      </span>

      <Button variant="berry" size="lg" onClick={handleAdd} className="flex-1">
        <Package size={18} aria-hidden="true" />
        {t("store.addToCart")}
      </Button>
    </div>
  );
}
