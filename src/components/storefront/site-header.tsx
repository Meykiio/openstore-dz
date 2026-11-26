import { Link } from "@tanstack/react-router";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n-context";
import { useStoreSettings } from "@/lib/queries";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { cn } from "@/lib/utils";

/**
 * Storefront header.
 *
 * The cart count is an aria-live region so a screen-reader user hears the basket
 * change when they add something, which is otherwise a silent state change.
 */
export function SiteHeader() {
  const { t } = useI18n();
  const { count, openCart } = useCart();
  const { data: settings } = useStoreSettings();
  const [menuOpen, setMenuOpen] = useState(false);

  const storeName = settings?.name?.trim() || t("app.tagline");

  const links = [
    { to: "/", label: t("nav.home") },
    { to: "/catalogue", label: t("nav.shop") },
    { to: "/track", label: t("nav.trackOrder") },
  ] as const;

  return (
    <header className="sticky top-0 z-30 border-b border-outline bg-nav-bg/95 backdrop-blur supports-[backdrop-filter]:bg-nav-bg/80">
      <div className="container-page flex h-16 items-center gap-3">
        <Link to="/" className="wordmark flex min-h-11 min-w-0 items-center gap-2 text-xl">
          {/* The bundled mark is the fallback, so a fresh install shows a logo
              instead of a generic icon. Setting logo_url in the admin replaces it. */}
          <img
            src={settings?.logo_url || "/logo.svg"}
            alt=""
            className="h-9 max-w-[120px] shrink-0 object-contain"
          />
          <span className="truncate">{storeName}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-full px-3 py-2 text-sm text-on-surface-muted transition-colors hover:bg-surface-mid hover:text-on-surface"
              activeOptions={{ exact: link.to === "/" }}
              activeProps={{ className: "text-on-surface font-medium" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <LocaleSwitcher className="hidden sm:block" />
          <ThemeToggle />

          <Link
            to="/search"
            className="inline-flex size-10 items-center justify-center rounded-full border border-outline text-on-surface transition-colors hover:bg-surface-mid"
            aria-label={t("nav.search")}
          >
            <Search size={18} aria-hidden="true" />
          </Link>

          <button
            type="button"
            onClick={openCart}
            data-testid="cart-open"
            className="relative inline-flex size-10 items-center justify-center rounded-full border border-outline text-on-surface transition-colors hover:bg-surface-mid"
            aria-label={t("cart.title")}
          >
            <ShoppingBag size={18} aria-hidden="true" />
            <span className="sr-only" aria-live="polite">
              {count > 0 ? (count === 1 ? t("cart.itemOne") : t("cart.itemMany", { count })) : ""}
            </span>
            {count > 0 && (
              <span
                aria-hidden="true"
                className="absolute -top-1 -end-1 grid size-5 place-items-center rounded-full bg-primary font-mono text-[0.65rem] font-semibold text-on-primary"
              >
                {count > 99 ? "99+" : count}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex size-10 items-center justify-center rounded-full border border-outline text-on-surface transition-colors hover:bg-surface-mid md:hidden"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? t("common.close") : t("nav.shop")}
          >
            {menuOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "overflow-hidden border-t border-outline transition-[max-height] duration-300 ease-out-soft md:hidden",
          menuOpen ? "max-h-80" : "max-h-0",
        )}
      >
        <nav className="container-page flex flex-col gap-1 py-3" aria-label="Mobile">
          <Link
            to="/search"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 rounded-[10px] px-3 py-2.5 text-sm hover:bg-surface-mid"
          >
            <Search size={16} aria-hidden="true" />
            {t("nav.search")}
          </Link>
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className="rounded-[10px] px-3 py-2.5 text-sm hover:bg-surface-mid"
            >
              {link.label}
            </Link>
          ))}
          <LocaleSwitcher className="mt-2 sm:hidden" />
        </nav>
      </div>
    </header>
  );
}
