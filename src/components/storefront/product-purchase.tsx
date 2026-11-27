import { useEffect, useState } from "react";
import { Check, MessageCircle, Package } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { formatDzd } from "@/lib/format";
import { MAX_PER_LINE, useCart } from "@/lib/cart";
import { useStoreSettings, type CatalogueProduct, type CatalogueVariant } from "@/lib/queries";
import { waLink } from "@/lib/whatsapp";
import { saleOf } from "@/lib/sale";

/**
 * The parts of a product page that actually sell something: stock, quantity,
 * add to cart and the WhatsApp order path. Split from `product-detail.tsx`
 * because everything here is an action and everything there is presentation.
 */
function variantLabel(variant: CatalogueVariant): string {
  const parts = [variant.size, variant.color_name].filter(Boolean);
  return parts.length > 0 ? parts.join(" / ") : "—";
}

export function StockLine({
  selected,
  hasStock,
}: {
  selected: CatalogueVariant | null;
  hasStock: boolean;
}) {
  const { t, locale } = useI18n();
  const low = selected !== null && selected.stock > 0 && selected.stock <= 3;
  const sale = selected ? saleOf(selected) : null;

  return (
    <div className="flex flex-col gap-3">
      {selected && (
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1" dir="ltr">
          <span className="font-mono text-3xl font-semibold text-[var(--on-surface)]">
            {formatDzd(selected.price, locale)}
          </span>
          {sale && (
            <>
              <span className="font-mono text-base text-on-surface-muted line-through">
                {formatDzd(sale.was, locale)}
              </span>
              <span className="bg-[var(--store-accent)] px-2 py-0.5 font-mono text-xs font-semibold text-[var(--store-accent-ink)]">
                −{sale.percent}%
              </span>
            </>
          )}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        {hasStock ? (
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-positive">
            <Check size={14} aria-hidden="true" />
            {t("store.inStock")}
          </span>
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-error">
            {t("store.outOfStock")}
          </span>
        )}
        {low && selected && (
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-tertiary">
            {t("store.lowStock", { count: selected.stock })}
          </span>
        )}
      </div>
    </div>
  );
}

export function AddToCart({
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
  const { t, locale } = useI18n();
  const { add } = useCart();
  const { data: settings } = useStoreSettings();

  const [pageUrl, setPageUrl] = useState("");
  useEffect(() => setPageUrl(window.location.href), []);

  const waHref = waLink(
    settings?.whatsapp,
    [
      t("store.waOrderIntro"),
      `${name}${selected ? ` — ${variantLabel(selected)}` : ""}`,
      `${quantity} × ${formatDzd(selected?.price ?? 0, locale)}`,
      pageUrl,
    ]
      .filter(Boolean)
      .join("\n"),
  );

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
    <div className="flex flex-col gap-3">
      <div className="flex items-stretch gap-2">
        <span className="ci-qty !h-12">
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            aria-label={`${t("common.quantity")} −`}
          >
            −
          </button>
          <span className="q" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() =>
              setQuantity((value) =>
                Math.min(selected?.stock ?? MAX_PER_LINE, MAX_PER_LINE, value + 1),
              )
            }
            aria-label={`${t("common.quantity")} +`}
          >
            +
          </button>
        </span>

        <button type="button" onClick={handleAdd} className="store-btn store-btn--accent flex-1">
          <Package size={17} aria-hidden="true" />
          {t("store.addToCart")}
        </button>
      </div>

      {waHref && (
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="store-btn store-btn--ghost store-btn--block"
        >
          <MessageCircle size={17} aria-hidden="true" />
          {t("store.orderViaWhatsapp")}
        </a>
      )}
    </div>
  );
}
