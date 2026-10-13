import { Link } from "@tanstack/react-router";
import { Banknote, Headphones, RotateCcw, Truck } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import type { CatalogueProduct, StoreSettings } from "@/lib/queries";
import { productImage } from "@/lib/queries";

/**
 * Storefront hero.
 *
 * Text left, newest product right. The reference's thesis is that photography
 * sells, so the visual is a real catalogue image rather than an illustration —
 * the hero is a preview of the shop, not a poster about it.
 */
export function HomeHero({
  settings,
  featured,
}: {
  settings: StoreSettings | null;
  featured: CatalogueProduct | null;
}) {
  const { t } = useI18n();
  const image = featured ? productImage(featured) : null;

  return (
    <section className="border-b border-outline bg-gradient-to-b from-bg to-bg-dim">
      <div className="container-page grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        <div className="flex flex-col items-start">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-outline bg-surface px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.03em] text-secondary">
            <span className="size-[7px] shrink-0 rounded-full bg-secondary" aria-hidden="true" />
            {t("home.trust.cod.title")}
          </span>

          <h1 className="mb-4 max-w-xl font-display text-[clamp(32px,5vw,56px)] font-semibold leading-[1.04] tracking-[-0.02em]">
            {settings?.name ?? "OpenStore DZ"}
          </h1>

          <p className="mb-7 max-w-[520px] text-base leading-[1.65] text-on-surface-muted">
            {settings?.tagline ?? t("home.cta.body")}
          </p>

          <div className="flex flex-wrap gap-3">
            <a href="#catalogue" className="btn btn-primary btn-lg">
              {t("home.promo.cta")}
            </a>
            <Link to="/track" className="btn btn-secondary btn-lg">
              {t("nav.trackOrder")}
            </Link>
          </div>
        </div>

        {image && featured && (
          <Link
            to="/product/$slug"
            params={{ slug: featured.slug }}
            className="group relative hidden overflow-hidden rounded-[24px] border border-outline bg-surface-high shadow-md lg:block"
          >
            <img
              src={image}
              alt={featured.name}
              className="aspect-[4/3] w-full object-cover transition-transform duration-500 ease-out-soft group-hover:scale-[1.03]"
            />
            <span className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 rounded-[16px] border border-outline bg-surface/95 px-4 py-3 backdrop-blur">
              <span className="min-w-0">
                <span className="block truncate font-display text-sm font-semibold">
                  {featured.name}
                </span>
                <span className="text-xs text-on-surface-muted">{t("home.newArrivals")}</span>
              </span>
              <span className="btn btn-primary btn-sm shrink-0">{t("store.viewDetails")}</span>
            </span>
          </Link>
        )}
      </div>
    </section>
  );
}

/**
 * Trust bar.
 *
 * Every claim here is one the platform actually keeps: cash on delivery is the
 * only payment method, coverage is all 58 wilayas, and the return window is a
 * real setting. Nothing is decorative marketing copy.
 */
export function TrustBar({ returnsDays }: { returnsDays: number }) {
  const { t } = useI18n();

  const items = [
    { icon: Banknote, title: t("home.trust.cod.title"), body: t("home.trust.cod.body") },
    {
      icon: Truck,
      title: t("home.trust.delivery.title"),
      body: t("home.trust.delivery.body"),
    },
    {
      icon: RotateCcw,
      title: t("home.trust.returns.title", { days: returnsDays }),
      body: t("home.trust.returns.body"),
    },
    { icon: Headphones, title: t("home.trust.support.title"), body: t("home.trust.support.body") },
  ] as const;

  return (
    <section className="border-b border-outline bg-surface">
      <div className="container-page grid gap-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.title} className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-[10px] border border-outline bg-primary/5 text-primary">
              <item.icon size={18} aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{item.title}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-on-surface-muted">
                {item.body}
              </span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
