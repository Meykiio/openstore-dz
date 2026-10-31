import { useEffect, useState } from "react";
import { Check, MessageCircle, Package } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { formatDzd } from "@/lib/format";
import { MAX_PER_LINE, useCart } from "@/lib/cart";
import { useStoreSettings, type CatalogueProduct, type CatalogueVariant } from "@/lib/queries";
import { waLink } from "@/lib/whatsapp";
import { saleOf } from "@/lib/sale";
import { Button } from "@/components/ui/button";

/**
 * The parts of a product page that actually sell something: stock, variant
 * choice, quantity, add to cart and the WhatsApp order path.
 *
 * Split out of `product-detail.tsx` when that file passed the 250-line limit.
 * The seam is real rather than arithmetic: everything here is an action, and
 * everything left there is presentation.
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
    <div className="flex flex-col gap-2">
      {selected && (
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1" dir="ltr">
          <span className="font-mono text-2xl font-semibold text-primary">
            {formatDzd(selected.price, locale)}
          </span>
          {sale && (
            <>
              <span className="font-mono text-base text-on-surface-muted line-through">
                {formatDzd(sale.was, locale)}
              </span>
              <span className="rounded-full bg-positive/12 px-2 py-0.5 font-mono text-xs font-semibold text-positive">
                −{sale.percent}%
              </span>
            </>
          )}
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

  // Read from state rather than `window` during render so the server and the
  // first client render agree. An empty value on first paint is filtered out of
  // the message below.
  const [pageUrl, setPageUrl] = useState("");
  useEffect(() => setPageUrl(window.location.href), []);

  /**
   * A buyer who is unsure will not fill in a form; they will send a message.
   * Carrying the product, the variant, the quantity and the page link into a
   * prefilled WhatsApp message turns that hesitation into an order, and costs
   * nothing to maintain.
   */
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
            onClick={() =>
              setQuantity((q) => Math.min(selected?.stock ?? MAX_PER_LINE, MAX_PER_LINE, q + 1))
            }
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

      {/* Secondary to adding to the cart, because a WhatsApp message is a real
          order path in Algeria and not a fallback for a broken form. */}
      {waHref && (
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost btn-lg btn-block"
        >
          <MessageCircle size={18} aria-hidden="true" />
          {t("store.orderViaWhatsapp")}
        </a>
      )}
    </div>
  );
}
