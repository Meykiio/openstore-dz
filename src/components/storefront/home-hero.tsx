import { Link } from "@tanstack/react-router";
import { Banknote, Headphones, RotateCcw, Truck } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import type { CatalogueProduct, StoreSettings } from "@/lib/queries";
import { productImage } from "@/lib/queries";
import { localized } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Storefront hero.
 *
 * Photography sells clothing, so the visual is the shop's own products: three
 * portrait shots in a staggered row, each a link. The type is the other half of
 * the identity — one heavy grotesque line, tight enough to read as a printed
 * headline, and no eyebrow label above it. The shop name is already the
 * wordmark in the header, so repeating it here only delays the headline.
 *
 * The owner's tagline and description are shown in the buyer's language. A shop
 * that has never filled them falls back to interface copy that explains the
 * offer rather than leaving a hole.
 */
export function HomeHero({
  settings,
  products,
}: {
  settings: StoreSettings | null;
  products: CatalogueProduct[];
}) {
  const { t, locale } = useI18n();
  // Two, not three. At the hero's width a third portrait becomes a thumbnail on
  // a phone; two keep enough size to show the garment.
  const shots = products
    .map((product) => ({ product, image: productImage(product) }))
    .filter((shot): shot is { product: CatalogueProduct; image: string } => shot.image !== null)
    .slice(0, 2);

  return (
    <section className="overflow-hidden border-b border-outline">
      <div className="container-page grid items-center gap-8 py-10 sm:py-14 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:py-16">
        <div className="flex flex-col items-start">
          <h1 className="hero-headline display-type max-w-[15ch] text-[clamp(2.2rem,5.4vw,4.1rem)] text-balance">
            {(locale === "ar" ? settings?.tagline : settings?.tagline_fr)?.trim() ||
              t("home.hero.title")}
          </h1>

          <p className="mt-5 max-w-[46ch] text-[15px] leading-[1.7] text-on-surface-muted">
            {/* The owner's own description, in the buyer's language. Falls back to
                the interface copy so a shop that never filled it still explains
                the offer instead of leaving a gap. */}
            {(locale === "ar" ? settings?.description : settings?.description_fr)?.trim() ||
              t("home.hero.body")}
          </p>

          <div className="mt-7 flex w-full flex-wrap gap-3 sm:w-auto">
            <Link to="/catalogue" className="btn btn-primary btn-lg flex-1 sm:flex-none">
              {t("home.promo.cta")}
            </Link>
            <Link to="/track" className="btn btn-secondary btn-lg flex-1 sm:flex-none">
              {t("nav.trackOrder")}
            </Link>
          </div>
        </div>

        {shots.length > 0 && (
          <div className="grid grid-cols-2 items-start gap-3 sm:gap-5">
            {shots.map(({ product, image }, index) => {
              const name = localized(locale, product.name, product.name_fr);
              return (
                <Link
                  key={product.id}
                  to="/product/$slug"
                  params={{ slug: product.slug }}
                  className={cn(
                    "hero-rise group relative block overflow-hidden rounded-[2px] border border-outline bg-surface-high",
                    index === 1 && "mt-8 sm:mt-14",
                  )}
                >
                  <img
                    src={image}
                    alt={name}
                    // The first photo is the largest paint above the fold.
                    loading={index === 0 ? "eager" : "lazy"}
                    fetchPriority={index === 0 ? "high" : "auto"}
                    decoding="async"
                    className="aspect-[4/5] w-full object-cover transition-transform duration-500 ease-out-soft group-hover:scale-[1.025]"
                  />
                  <span className="absolute inset-x-0 bottom-0 hidden bg-gradient-to-t from-black/60 to-transparent px-3 pt-8 pb-3 text-xs font-medium text-white sm:block">
                    <span className="line-clamp-1">{name}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Trust bar.
 *
 * Every claim here is one the platform actually keeps: cash on delivery is the
 * only payment method, coverage is all 69 wilayas, and the return window is a
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
            <span className="grid size-10 shrink-0 place-items-center rounded-[2px] border border-outline bg-bg text-secondary">
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
