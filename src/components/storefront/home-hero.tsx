import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Banknote, Headphones, RotateCcw, Truck } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import type { CatalogueProduct, StoreSettings } from "@/lib/queries";
import { priceRange, productImage, sortVariants } from "@/lib/queries";
import { localized } from "@/lib/i18n";
import { formatDzd } from "@/lib/format";
import { saleOf } from "@/lib/sale";

/**
 * Storefront hero.
 *
 * The visual is the shop's own newest product, at full height, with a second
 * piece printed over the corner like a lookbook page. The headline is interface
 * copy rather than the owner's tagline: a storefront needs a point of view even
 * before the owner has written one, and the tagline belongs in the lede where it
 * can change without breaking the layout.
 */
export function HomeHero({
  settings,
  products,
}: {
  settings: StoreSettings | null;
  products: CatalogueProduct[];
}) {
  const { t, locale } = useI18n();
  const shots = products
    .map((product) => ({ product, image: productImage(product) }))
    .filter((shot): shot is { product: CatalogueProduct; image: string } => shot.image !== null)
    .slice(0, 2);
  const [main, side] = shots;

  const tagline = settings?.tagline
    ? localized(locale, settings.tagline, settings.tagline_fr)
    : null;
  const description = settings?.description
    ? localized(locale, settings.description, settings.description_fr)
    : null;
  const lede = description || tagline || t("home.hero.body");

  const price = (product: CatalogueProduct) => {
    const range = priceRange(product);
    if (!range) return null;
    const cheapest = sortVariants(product.product_variants).find(
      (variant) => variant.price === range.min,
    );
    const sale = cheapest ? saleOf(cheapest) : null;
    return { now: formatDzd(range.min, locale), was: sale ? formatDzd(sale.was, locale) : null };
  };
  const mainPrice = main ? price(main.product) : null;
  const sidePrice = side ? price(side.product) : null;
  const mainName = main ? localized(locale, main.product.name, main.product.name_fr) : null;
  const sideName = side ? localized(locale, side.product.name, side.product.name_fr) : null;

  return (
    <section className="store-hero">
      <div className="container-page store-hero-grid">
        <div className="store-hero-copy">
          <p className="store-eyebrow">{t("home.hero.eyebrow")}</p>
          <h1 className="store-display store-hero-title">
            <span>{t("home.hero.line1")}</span>{" "}
            <span className="outline">{t("home.hero.line2")}</span>
          </h1>
          <p className="store-hero-lede">{lede}</p>

          <div className="store-hero-actions">
            <Link to="/catalogue" className="store-btn store-btn--fill">
              {t("home.hero.cta")}
              <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
            <a href="#universes" className="store-btn store-btn--ghost">
              {t("home.hero.secondary")}
            </a>
          </div>

          <dl className="store-hero-meta">
            <div>
              <dt>{t("home.hero.meta.cod")}</dt>
              <dd>{t("home.hero.meta.codValue")}</dd>
            </div>
            <div>
              <dt>{t("home.hero.meta.delivery")}</dt>
              <dd>{t("home.hero.meta.deliveryValue")}</dd>
            </div>
            <div>
              <dt>{t("home.hero.meta.returns")}</dt>
              <dd>{t("home.hero.meta.returnsValue", { days: settings?.returns_days ?? 14 })}</dd>
            </div>
            <div>
              <dt>{t("home.hero.meta.help")}</dt>
              <dd>{t("home.hero.meta.helpValue")}</dd>
            </div>
          </dl>
        </div>

        <div className="store-hero-media">
          {main ? (
            <Link
              to="/product/$slug"
              params={{ slug: main.product.slug }}
              className="store-hero-main"
            >
              <img src={main.image} alt="" loading="eager" fetchPriority="high" decoding="async" />
              {mainName && (
                <span className="store-hero-name">
                  <strong>{mainName}</strong>
                  {mainPrice && <span dir="ltr">{mainPrice.now}</span>}
                </span>
              )}
            </Link>
          ) : (
            <div className="store-hero-fallback">
              <strong>01</strong>
              <span>{t("home.hero.fallback")}</span>
            </div>
          )}

          {side && sideName && (
            <Link
              to="/product/$slug"
              params={{ slug: side.product.slug }}
              className="store-hero-side"
            >
              <img src={side.image} alt="" loading="lazy" decoding="async" />
              <span>
                <span className="hs-name">{sideName}</span>
                {sidePrice && (
                  <span className="hs-price" dir="ltr">
                    {sidePrice.now}
                  </span>
                )}
              </span>
            </Link>
          )}

          <span className="store-hero-vertical" aria-hidden="true">
            {settings?.name ?? "OPENSTORE DZ"}
          </span>
        </div>
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
    { icon: Truck, title: t("home.trust.delivery.title"), body: t("home.trust.delivery.body") },
    {
      icon: RotateCcw,
      title: t("home.trust.returns.title", { days: returnsDays }),
      body: t("home.trust.returns.body"),
    },
    { icon: Headphones, title: t("home.trust.support.title"), body: t("home.trust.support.body") },
  ] as const;

  return (
    <section className="store-trust">
      <div className="container-page store-trust-grid">
        {items.map((item) => (
          <div key={item.title} className="store-trust-item">
            <item.icon size={20} aria-hidden="true" />
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
