import { useEffect, useState } from "react";
import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/feedback";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n-context";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "لوحة التحكم" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const COLLAPSE_KEY = "openstore-admin-nav-collapsed";

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
  const { isAdmin, loading, user } = useAuth();
  const [navOpen, setNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Read the stored preference after mount rather than in the initialiser: the
  // server cannot read localStorage, and rendering the collapsed rail on the
  // client's first pass would be a hydration mismatch.
  useEffect(() => {
    if (window.localStorage.getItem(COLLAPSE_KEY) === "1") setCollapsed(true);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("nav-collapsed", collapsed);
    return () => document.documentElement.classList.remove("nav-collapsed");
  }, [collapsed]);

  // The drawer covers the page, so the page underneath must not scroll.
  useEffect(() => {
    document.body.classList.toggle("admin-nav-locked", navOpen);
    return () => document.body.classList.remove("admin-nav-locked");
  }, [navOpen]);

  // An overlay is expected to close on Escape, and a phone keyboard is the case
  // this actually matters for.
  useEffect(() => {
    if (!navOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
  };

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

  return (
    <div className="admin-shell">
      <AdminSidebar
        open={navOpen}
        collapsed={collapsed}
        onNavigate={() => setNavOpen(false)}
        onToggleCollapse={toggleCollapse}
      />

      <div className="admin-page">
        <div className="admin-topbar">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label={t("admin.nav.menu")}
            aria-expanded={navOpen}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-outline text-on-surface"
          >
            <Menu size={18} aria-hidden="true" />
          </button>
          <span className="truncate font-display font-semibold">{t("admin.dashboard.title")}</span>
        </div>

        <main className="container-page py-6 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
