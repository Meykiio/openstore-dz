import { Link } from "@tanstack/react-router";
import { Menu, ShoppingBag, Store, X } from "lucide-react";
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
    { to: "/", label: t("nav.shop") },
    { to: "/track", label: t("nav.trackOrder") },
  ] as const;

  return (
    <header className="sticky top-0 z-30 border-b border-outline bg-nav-bg/95 backdrop-blur supports-[backdrop-filter]:bg-nav-bg/80">
      <div className="container-page flex h-16 items-center gap-3">
        <Link
          to="/"
          className="flex min-h-11 min-w-0 items-center gap-2 font-display text-lg font-semibold"
        >
          <Store size={20} className="shrink-0 text-primary" aria-hidden="true" />
          <span className="truncate">{storeName}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-full px-3 py-2 text-sm text-on-surface-muted transition-colors hover:bg-surface-mid hover:text-on-surface"
              activeProps={{ className: "text-on-surface font-medium" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <LocaleSwitcher className="hidden sm:block" />
          <ThemeToggle />

          <button
            type="button"
            onClick={openCart}
            className="relative inline-flex size-10 items-center justify-center rounded-full border border-outline text-on-surface transition-colors hover:bg-surface-mid"
            aria-label={t("cart.title")}
          >
            <ShoppingBag size={18} aria-hidden="true" />
            <span className="sr-only" aria-live="polite">
              {count > 0 ? t("cart.itemMany", { count }) : ""}
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
          menuOpen ? "max-h-56" : "max-h-0",
        )}
      >
        <nav className="container-page flex flex-col gap-1 py-3" aria-label="Mobile">
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
