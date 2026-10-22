import { Link, useRouterState } from "@tanstack/react-router";
import { Home, LayoutGrid, ShoppingBag, Truck } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";

/**
 * Bottom tab bar.
 *
 * The reference system's "Phone Feelings" directive: under 1024px the storefront
 * behaves like an app and primary navigation moves into the thumb zone, because
 * a shop that buries its cart behind a hamburger loses mobile orders. Hidden at
 * 1024px and above by the `.bottom-nav` rule in styles.css.
 *
 * The cart count is announced politely so adding an item is not a silent change
 * for a screen-reader user.
 */
export function BottomNav() {
  const { t } = useI18n();
  const { count, openCart } = useCart();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const tabs = [
    { key: "home", to: "/", label: t("nav.home"), icon: Home },
    { key: "shop", to: "/catalogue", label: t("nav.shop"), icon: LayoutGrid },
    { key: "track", to: "/track", label: t("nav.trackOrder"), icon: Truck },
  ] as const;

  // The owner reaches the dashboard from the footer. A buyer's tab bar is for
  // buying, and a "Dashboard" tab there reads as a broken link.
  const shopPaths = ["/catalogue", "/category", "/product", "/search"];

  return (
    <nav className="bottom-nav" aria-label={t("nav.shop")}>
      {tabs.map((tab) => {
        const active =
          tab.key === "home"
            ? pathname === "/"
            : tab.key === "shop"
              ? shopPaths.some((path) => pathname.startsWith(path))
              : pathname.startsWith(tab.to);
        return (
          <Link key={tab.key} to={tab.to} className={cn("bn-item", active && "active")}>
            <tab.icon aria-hidden="true" />
            <span>{tab.label}</span>
          </Link>
        );
      })}

      <button type="button" className="bn-item" onClick={openCart} aria-label={t("cart.title")}>
        <ShoppingBag aria-hidden="true" />
        <span>{t("nav.cart")}</span>
        <span className="sr-only" aria-live="polite">
          {count > 0 ? t("cart.itemMany", { count }) : ""}
        </span>
        {count > 0 && (
          <span className="bn-badge" aria-hidden="true">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>
    </nav>
  );
}
