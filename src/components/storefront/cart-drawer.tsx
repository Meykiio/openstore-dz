import { Link } from "@tanstack/react-router";
import { ShoppingBag, Trash2, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useCart, type CartItem } from "@/lib/cart";
import { useI18n } from "@/lib/i18n-context";
import { formatDzd } from "@/lib/format";
import { useStoreSettings } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";

/**
 * Cart drawer.
 *
 * A native `<dialog>` restyled as a side sheet: `showModal()` handles the focus
 * trap, Esc and inertness of the page behind, which a div-based drawer usually
 * gets subtly wrong. It must be opened with `showModal()`, not the `open`
 * attribute — `open` renders non-modally, so there is no backdrop, no focus
 * trap, and Esc does nothing.
 */
export function CartDrawer() {
  const { t } = useI18n();
  const { items, subtotal, count, isOpen, closeCart } = useCart();
  const { data: settings } = useStoreSettings();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (isOpen && !el.open) el.showModal();
    if (!isOpen && el.open) el.close();
  }, [isOpen]);

  return (
    <dialog
      ref={ref}
      onClose={closeCart}
      onClick={(event) => {
        if (event.target === ref.current) closeCart();
      }}
      aria-labelledby="cart-title"
      // Full width on a phone, a side sheet from 640px. A 94vw panel on a 320px
      // screen leaves a strip of backdrop that reads as a misaligned element
      // rather than as somewhere to tap, and the cart is where the most
      // information has to fit.
      className="ms-auto me-0 my-0 h-dvh max-h-dvh w-full rounded-none border-0 border-s border-outline bg-nav-bg p-0 text-on-surface shadow-lg backdrop:bg-black/45 sm:w-[400px]"
    >
      <div className="flex h-full flex-col">
        <div className="cart-head">
          <h2
            id="cart-title"
            className="flex items-center gap-2 font-display text-[17px] font-semibold"
          >
            <ShoppingBag size={18} className="text-primary" aria-hidden="true" />
            {t("cart.title")}
          </h2>
          <span className="flex items-center gap-3">
            <span className="font-mono text-xs text-on-surface-muted">
              {count > 0 ? t("cart.itemMany", { count }) : ""}
            </span>
            <button
              type="button"
              onClick={closeCart}
              aria-label={t("common.close")}
              className="cart-close"
            >
              <X aria-hidden="true" />
            </button>
          </span>
        </div>

        <ShippingBar subtotal={subtotal} threshold={settings?.free_shipping_threshold ?? 0} />

        {items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-5">
            <EmptyState
              title={t("cart.empty")}
              action={
                <Button variant="secondary" onClick={closeCart}>
                  {t("cart.emptyAction")}
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto px-6">
              {items.map((line) => (
                <CartLine key={line.variantId} line={line} />
              ))}
            </ul>
            <CartFooter subtotal={subtotal} onClose={closeCart} />
          </>
        )}
      </div>
    </dialog>
  );
}

/**
 * Free-shipping progress. The reference's signature cart component.
 *
 * Hidden when the owner has not set a threshold, so a shop that does not offer
 * free delivery never shows a bar it can never fill.
 */
function ShippingBar({ subtotal, threshold }: { subtotal: number; threshold: number }) {
  const { t, locale } = useI18n();
  const { items } = useCart();
  if (threshold <= 0 || items.length === 0) return null;

  const remaining = Math.max(0, threshold - subtotal);
  const progress = Math.min(100, Math.round((subtotal / threshold) * 100));

  return (
    <div className="cart-ship">
      <p className="msg">
        {remaining > 0 ? (
          <>
            {/* Split around the amount rather than interpolated into one string:
                the figure needs `dir="ltr"` so it does not reorder inside Arabic,
                and it needs to stay bold. All three locales happen to read
                verb, amount, rest, so the seam holds. */}
            {t("cart.freeShippingAdd")} <b dir="ltr">{formatDzd(remaining, locale)}</b>{" "}
            {t("cart.freeShippingRemaining")}
          </>
        ) : (
          <b>{t("cart.gotFreeShipping")}</b>
        )}
      </p>
      <div
        className="cart-ship-bar"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t("cart.freeShippingProgress")}
      >
        <div className="cart-ship-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function CartLine({ line }: { line: CartItem }) {
  const { t, locale } = useI18n();
  const { setQuantity, remove, closeCart } = useCart();

  return (
    <li className="cart-item">
      <span className="ci-thumb">
        {line.imageUrl ? <img src={line.imageUrl} alt="" loading="lazy" /> : null}
      </span>

      <span className="min-w-0 flex-1">
        <Link
          to="/product/$slug"
          params={{ slug: line.slug }}
          onClick={closeCart}
          className="ci-name line-clamp-2 hover:text-primary"
        >
          {line.name}
        </Link>
        {line.variantLabel && <span className="ci-meta block">{line.variantLabel}</span>}

        <span className="flex items-center justify-between gap-2">
          <span className="ci-qty">
            <button
              type="button"
              onClick={() => setQuantity(line.variantId, line.quantity - 1)}
              aria-label={`${t("common.quantity")} − ${line.name}`}
            >
              −
            </button>
            <span className="q">{line.quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity(line.variantId, line.quantity + 1)}
              aria-label={`${t("common.quantity")} + ${line.name}`}
            >
              +
            </button>
          </span>
          <span className="flex items-center gap-2">
            <span className="ci-price" dir="ltr">
              {formatDzd(line.unitPrice * line.quantity, locale)}
            </span>
            <button
              type="button"
              onClick={() => remove(line.variantId)}
              aria-label={`${t("cart.remove")} — ${line.name}`}
              className="text-on-surface-muted hover:text-error"
            >
              <Trash2 size={15} aria-hidden="true" />
            </button>
          </span>
        </span>
      </span>
    </li>
  );
}

function CartFooter({ subtotal, onClose }: { subtotal: number; onClose: () => void }) {
  const { t, locale } = useI18n();
  return (
    <div className="cart-foot safe-bottom">
      <div className="cart-sub">
        <span className="l">{t("cart.subtotal")}</span>
        <span className="v" dir="ltr">
          {formatDzd(subtotal, locale)}
        </span>
      </div>
      <p className="cart-note">{t("cart.deliveryCalculated")}</p>
      <Button variant="berry" size="lg" asChild>
        <Link to="/checkout" onClick={onClose}>
          {t("cart.checkout")}
        </Link>
      </Button>
      <button
        type="button"
        onClick={onClose}
        className="mt-2 w-full py-2 text-sm text-on-surface-muted hover:text-on-surface"
      >
        {t("cart.continueShopping")}
      </button>
    </div>
  );
}
