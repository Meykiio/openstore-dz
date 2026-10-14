import { Link } from "@tanstack/react-router";
import {
  ChevronsLeft,
  ClipboardList,
  LogOut,
  Package,
  Settings,
  Star,
  Store,
  Truck,
  X,
} from "lucide-react";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";

/**
 * Admin navigation rail.
 *
 * One component serving two patterns, because they are the same navigation:
 * a fixed rail with a collapse control from 1024px, and an overlay drawer below
 * it. The difference is CSS only, which is why there is no second component and
 * no duplicated link list to drift.
 *
 * The rail sits on the inline start edge, so it is on the right in Arabic and the
 * left in French or English without any branching here. See the `.admin-sidebar`
 * block in styles.css for how the drawer offset is made direction-aware.
 */

const LINKS = [
  { to: "/admin", labelKey: "admin.nav.overview", icon: ClipboardList, exact: true },
  { to: "/admin/products", labelKey: "admin.products.title", icon: Package, exact: false },
  { to: "/admin/reviews", labelKey: "admin.reviews.title", icon: Star, exact: false },
  { to: "/admin/delivery", labelKey: "admin.delivery.title", icon: Truck, exact: false },
  { to: "/admin/settings", labelKey: "admin.settings.title", icon: Settings, exact: false },
] as const;

export function AdminSidebar({
  open,
  collapsed,
  onNavigate,
  onToggleCollapse,
}: {
  open: boolean;
  collapsed: boolean;
  onNavigate: () => void;
  onToggleCollapse: () => void;
}) {
  const { t } = useI18n();
  const { signOut } = useAuth();

  return (
    <>
      {/* Clicking away closes the drawer. Hidden from assistive tech because the
          close button in the header does the same job and is reachable. */}
      <div
        className={cn("admin-backdrop", open && "show")}
        onClick={onNavigate}
        aria-hidden="true"
      />

      <aside className={cn("admin-sidebar", open && "open")} aria-label={t("nav.dashboard")}>
        <div className="admin-sidebar-header">
          <Link
            to="/admin"
            onClick={onNavigate}
            className="admin-sidebar-brand flex min-w-0 items-center gap-2 font-display font-semibold"
          >
            <Store size={18} className="shrink-0 text-primary" aria-hidden="true" />
            <span className="truncate">{t("admin.dashboard.title")}</span>
          </Link>

          <button
            type="button"
            onClick={onNavigate}
            aria-label={t("common.close")}
            className="ms-auto inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-outline text-on-surface-muted lg:hidden"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          <p className="admin-nav-group-label">{t("admin.nav.manage")}</p>
          <ul>
            {LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  onClick={onNavigate}
                  activeOptions={{ exact: link.exact }}
                  activeProps={{ className: "active" }}
                  className="admin-nav-item"
                  title={t(link.labelKey)}
                >
                  <link.icon aria-hidden="true" />
                  <span className="admin-nav-label">{t(link.labelKey)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="admin-sidebar-footer">
          <LocaleSwitcher className="min-w-0 flex-1" />
          <ThemeToggle />
        </div>

        <div className="admin-sidebar-footer flex-col !items-stretch">
          <Link
            to="/"
            onClick={onNavigate}
            className="admin-nav-item justify-center border border-outline"
          >
            <Store aria-hidden="true" />
            <span className="admin-nav-label">{t("admin.shopLink")}</span>
          </Link>

          <button
            type="button"
            onClick={() => void signOut()}
            className="admin-nav-item justify-center"
          >
            <LogOut aria-hidden="true" />
            <span className="admin-nav-label">{t("nav.logout")}</span>
          </button>

          <button
            type="button"
            onClick={onToggleCollapse}
            aria-expanded={!collapsed}
            aria-label={collapsed ? t("admin.nav.expand") : t("admin.nav.collapse")}
            className="admin-collapse-toggle admin-nav-item !border !border-outline justify-center"
          >
            <ChevronsLeft
              aria-hidden="true"
              className={cn("transition-transform duration-300", collapsed && "rotate-180")}
            />
            <span className="admin-nav-label">
              {collapsed ? t("admin.nav.expand") : t("admin.nav.collapse")}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
