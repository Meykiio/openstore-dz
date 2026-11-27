import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, Search, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n-context";
import { useStoreSettings } from "@/lib/queries";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { cn } from "@/lib/utils";
import { SiteMobileMenu } from "./site-mobile-menu";
import { isStoreNavActive, useStoreNavLinks } from "./site-nav";

/**
 * Storefront header.
 *
 * A three-part editorial masthead: wordmark, universe navigation, actions.
 * Under 1024px the navigation becomes a full-screen menu rather than a cramped
 * dropdown, because the four universes are the shop's primary structure. The
 * cart count is announced politely so adding an item is not a silent change.
 */
export function SiteHeader() {
  const { t } = useI18n();
  const { count, openCart } = useCart();
  const { data: settings } = useStoreSettings();
  const [menuOpen, setMenuOpen] = useState(false);
  const links = useStoreNavLinks();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const storeName = settings?.name?.trim() || t("app.tagline");
  const isActive = (link: (typeof links)[number]) => isStoreNavActive(link, pathname);

  return (
    <header className="store-header">
      <div className="container-page store-header-inner">
        <Link to="/" className="store-wordmark" aria-label={storeName}>
          <span className="mark" aria-hidden="true" />
          {settings?.logo_url && <img src={settings.logo_url} alt="" />}
          <span className="truncate">{storeName}</span>
        </Link>

        <nav className="store-nav" aria-label={t("nav.menu")}>
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn("store-nav-link", isActive(link) && "is-active")}
              aria-current={isActive(link) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="store-header-actions">
          <Link
            to="/search"
            className="store-icon-btn"
            aria-label={t("nav.search")}
            title={t("nav.search")}
          >
            <Search size={18} aria-hidden="true" />
          </Link>

          <span className="store-locale hidden lg:inline-flex">
            <LocaleSwitcher />
          </span>

          <span className="store-theme hidden lg:inline-flex">
            <ThemeToggle />
          </span>

          <button
            type="button"
            onClick={openCart}
            data-testid="cart-open"
            className="store-icon-btn relative"
            aria-label={t("cart.title")}
          >
            <ShoppingBag size={18} aria-hidden="true" />
            <span className="sr-only" aria-live="polite">
              {count > 0 ? (count === 1 ? t("cart.itemOne") : t("cart.itemMany", { count })) : ""}
            </span>
            {count > 0 && (
              <span className="store-cart-count" aria-hidden="true">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="store-icon-btn store-menu-toggle"
            aria-expanded={menuOpen}
            aria-label={t("nav.menu")}
          >
            <Menu size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      {menuOpen && (
        <SiteMobileMenu links={links} storeName={storeName} onClose={() => setMenuOpen(false)} />
      )}
    </header>
  );
}
