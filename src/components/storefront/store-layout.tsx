import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { CartDrawer } from "./cart-drawer";
import { BottomNav } from "./bottom-nav";
import { AnnouncementBar } from "./announcement-bar";

/**
 * Shared storefront chrome.
 *
 * Applied per route rather than through a pathless layout route, so a new page
 * has to opt in explicitly. A page that renders without the header is then a
 * visible omission in review rather than a silent inheritance bug.
 *
 * `page-bottom-pad` keeps page content clear of the fixed bottom tab bar on
 * mobile; the tab bar is hidden at 1024px and above.
 */
export function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <AnnouncementBar />
      <SiteHeader />
      <main className="page-bottom-pad flex-1 lg:pb-0">{children}</main>
      <SiteFooter />
      <CartDrawer />
      <BottomNav />
    </div>
  );
}
