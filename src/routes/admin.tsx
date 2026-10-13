import { useState } from "react";
import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import {
  ClipboardList,
  LogOut,
  Menu,
  Package,
  Settings,
  Star,
  Store,
  Truck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/feedback";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "لوحة التحكم" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

/**
 * Admin shell and guard.
 *
 * The guard lives here rather than in a router `beforeLoad` because the admin
 * role comes from an async session lookup held in React state, not from router
 * context. Rendering the check is the honest option: a `beforeLoad` would have
 * to assume a value it does not yet have.
 */
function AdminLayout() {
  const { t } = useI18n();
  const { isAdmin, loading, user, signOut } = useAuth();
  const [navOpen, setNavOpen] = useState(false);

  if (loading) return <LoadingState className="min-h-dvh" />;

  if (!isAdmin) {
    return (
      <main className="container-page flex min-h-dvh flex-col items-center justify-center gap-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold">{t("admin.login.title")}</h1>
        <p className="max-w-sm text-sm text-on-surface-muted">
          {user ? t("admin.login.notAdmin") : t("admin.login.body")}
        </p>
        <Button asChild>
          <Link to="/login">{t("admin.login.submit")}</Link>
        </Button>
      </main>
    );
  }

  const links = [
    { to: "/admin", label: t("admin.orders.title"), icon: ClipboardList },
    { to: "/admin/products", label: t("admin.products.title"), icon: Package },
    { to: "/admin/reviews", label: t("admin.reviews.title"), icon: Star },
    { to: "/admin/delivery", label: t("admin.delivery.title"), icon: Truck },
    { to: "/admin/settings", label: t("admin.settings.title"), icon: Settings },
  ] as const;

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <aside
        className={cn(
          "border-b border-outline bg-surface lg:w-64 lg:border-b-0 lg:border-e",
          "lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto",
        )}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-5 lg:py-5">
          <Link to="/admin" className="flex items-center gap-2 font-display font-semibold">
            <Store size={18} className="text-primary" aria-hidden="true" />
            {t("nav.dashboard")}
          </Link>
          <button
            type="button"
            onClick={() => setNavOpen((open) => !open)}
            aria-expanded={navOpen}
            aria-label={navOpen ? t("common.close") : t("admin.orders.title")}
            className="inline-flex size-9 items-center justify-center rounded-full border border-outline lg:hidden"
          >
            {navOpen ? <X size={16} aria-hidden="true" /> : <Menu size={16} aria-hidden="true" />}
          </button>
        </div>

        <nav
          className={cn(
            "overflow-hidden px-2 pb-3 transition-[max-height] duration-300 lg:max-h-none",
            navOpen ? "max-h-96" : "max-h-0 lg:max-h-none",
          )}
          aria-label={t("nav.dashboard")}
        >
          <ul className="flex flex-col gap-1">
            {links.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  onClick={() => setNavOpen(false)}
                  activeProps={{ className: "bg-primary/10 text-primary font-medium" }}
                  activeOptions={{ exact: link.to === "/admin" }}
                  className="flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-sm text-on-surface-muted transition-colors hover:bg-surface-mid hover:text-on-surface"
                >
                  <link.icon size={16} aria-hidden="true" />
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2 border-t border-outline px-3 py-3 lg:px-4">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>

        <div className="flex flex-col gap-2 border-t border-outline px-3 py-3 lg:px-4">
          <Button asChild variant="outline" size="sm">
            <Link to="/">{t("nav.shop")}</Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void signOut()}
            className="justify-start text-on-surface-muted"
          >
            <LogOut size={15} aria-hidden="true" />
            {t("nav.logout")}
          </Button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 bg-bg">
        <div className="container-page py-6 sm:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
