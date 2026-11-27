import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Shirt, ShoppingBag, Sparkles, Trophy } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";

/**
 * Bottom tab bar.
 *
 * Under 1024px the storefront behaves like an app and the three universes move
 * into the thumb zone: Anime, Street and Football are the shop's primary
 * structure, so they are one tap away rather than buried behind a hamburger.
 * The cart stays visible because that is where mobile orders complete.
 *
 * Hidden at 1024px and above by the `.bottom-nav` rule in styles.css.
 */
export function BottomNav() {
  const { t } = useI18n();
  const { count, openCart } = useCart();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const tabs = [
    { key: "home", to: "/", label: t("nav.home"), icon: Home },
    { key: "anime", to: "/anime", label: t("nav.anime"), icon: Sparkles },
    { key: "streetwear", to: "/streetwear", label: t("nav.streetwear"), icon: Shirt },
    { key: "football", to: "/football", label: t("nav.football"), icon: Trophy },
  ] as const;

  return (
    <nav className="bottom-nav" aria-label={t("nav.menu")}>
      {tabs.map((tab) => {
        const active = tab.to === "/" ? pathname === "/" : pathname.startsWith(tab.to);
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
          {count > 0 ? (count === 1 ? t("cart.itemOne") : t("cart.itemMany", { count })) : ""}
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
