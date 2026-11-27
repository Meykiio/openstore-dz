import { useI18n } from "@/lib/i18n-context";

/** A primary storefront destination. `shop` marks the catalogue family. */
export type StoreNavLink = {
  to: "/" | "/catalogue" | "/anime" | "/streetwear" | "/football" | "/track";
  label: string;
  shop?: boolean;
};

/** The six primary destinations, in reading order. */
export function useStoreNavLinks(): StoreNavLink[] {
  const { t } = useI18n();
  return [
    { to: "/", label: t("nav.home") },
    { to: "/catalogue", label: t("nav.shop"), shop: true },
    { to: "/anime", label: t("nav.anime") },
    { to: "/streetwear", label: t("nav.streetwear") },
    { to: "/football", label: t("nav.football") },
    { to: "/track", label: t("nav.trackOrder") },
  ];
}

/** Active state for the masthead, including the catalogue's sub-pages. */
export function isStoreNavActive(link: StoreNavLink, pathname: string): boolean {
  if (link.to === "/") return pathname === "/";
  if (link.shop) {
    return (
      pathname.startsWith("/catalogue") ||
      pathname.startsWith("/category") ||
      pathname.startsWith("/product")
    );
  }
  return pathname.startsWith(link.to);
}
