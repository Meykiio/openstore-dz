import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, X } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleSwitcher } from "@/components/locale-switcher";
import type { StoreNavLink } from "./site-nav";

/**
 * Full-screen mobile navigation.
 *
 * The four universes are the shop's main structure, so on a phone they get
 * numbered editorial links rather than a cramped dropdown. The menu owns the
 * scroll lock and Escape handling because it is the layer that covers the page.
 */
export function SiteMobileMenu({
  links,
  storeName,
  onClose,
}: {
  links: StoreNavLink[];
  storeName: string;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // The menu covers the page, so the page behind it is locked and the
    // keyboard is moved inside: Tab must not reach controls the menu hides.
    const opener = document.activeElement as HTMLElement | null;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusable = () =>
      Array.from(
        menu.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
    focusable()[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
      // Closing returns the keyboard to the button that opened the menu.
      opener?.focus();
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={menu}
      className="store-mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label={t("nav.menu")}
    >
      <div className="store-mobile-menu-top">
        <span className="store-wordmark">
          <span className="mark" aria-hidden="true" />
          <span className="truncate">{storeName}</span>
        </span>
        <button
          type="button"
          onClick={onClose}
          className="store-mobile-menu-close"
          aria-label={t("common.close")}
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      <nav className="store-mobile-links" aria-label={t("nav.menu")}>
        {links
          .filter((link) => link.to !== "/track")
          .map((link, index) => (
            <Link key={link.to} to={link.to} onClick={onClose}>
              <span>{link.label}</span>
              <span>{String(index + 1).padStart(2, "0")}</span>
            </Link>
          ))}
        <Link to="/search" onClick={onClose}>
          <span>{t("nav.search")}</span>
          <span>
            {String(links.filter((link) => link.to !== "/track").length + 1).padStart(2, "0")}
          </span>
        </Link>
        <Link to="/track" onClick={onClose}>
          <span>{t("nav.trackOrder")}</span>
          <span>
            <ArrowUpRight size={14} aria-hidden="true" />
          </span>
        </Link>
      </nav>

      <div className="store-mobile-menu-foot">
        <LocaleSwitcher />
        <ThemeToggle />
        <span>{t("home.ticker.cod")}</span>
      </div>
    </div>,
    document.body,
  );
}
