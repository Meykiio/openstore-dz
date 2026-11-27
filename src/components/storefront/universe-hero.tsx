import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import type { TranslationKey } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n-context";
import { productImage } from "@/lib/queries";
import { UNIVERSES, universeConfig, type UniverseCatalog, type UniverseKey } from "@/lib/universes";

/**
 * Universe hero and the doors out of it.
 *
 * The hero uses the first real photograph the universe can answer, never a
 * stock image, and falls back to a typographic panel when the shop has no
 * photography yet.
 */
export function UniverseHero({
  catalog,
  universe,
  ctaKey = "universe.allPieces",
}: {
  catalog: UniverseCatalog;
  universe: UniverseKey;
  /** Label of the accent button that scrolls to `#pieces`. */
  ctaKey?: TranslationKey;
}) {
  const { t } = useI18n();
  const config = universeConfig(universe);
  const image = catalog.members.map((product) => productImage(product)).find(Boolean) ?? null;
  const shelves = catalog.sections.reduce(
    (total, section) => total + section.entries.filter((row) => row.count > 0).length,
    0,
  );
  const stats = [
    { key: "pieces", label: t("universe.statPieces"), value: catalog.members.length },
    ...(shelves > 0
      ? [{ key: "shelves", label: t("universe.statCollections"), value: shelves }]
      : []),
  ];

  return (
    <section
      className="store-universe-hero"
      style={{ "--u-accent": config.accent } as React.CSSProperties}
    >
      <div className="store-universe-hero-inner container-page">
        <div className="store-universe-hero-copy">
          <p className="store-eyebrow">
            {config.index} — {t(config.kickerKey)}
          </p>
          <h1 className="store-universe-title">{t(config.titleKey)}</h1>
          <p className="store-universe-intro">{t(config.introKey)}</p>

          {stats.length > 0 && (
            <dl className="store-universe-stats">
              {stats.map((stat) => (
                <div key={stat.key}>
                  <dt>{stat.label}</dt>
                  <dd>{stat.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {catalog.members.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#pieces" className="store-btn store-btn--accent">
                {t(ctaKey)}
                <ArrowUpRight size={15} aria-hidden="true" />
              </a>
              <Link to="/catalogue" className="store-btn store-btn--ghost">
                {t("nav.products")}
              </Link>
            </div>
          )}
        </div>

        <div className="store-universe-hero-media">
          {image ? (
            <img src={image} alt="" loading="eager" fetchPriority="high" decoding="async" />
          ) : (
            <div className="store-hero-fallback">
              <strong>{config.index}</strong>
              <span>{t("home.hero.fallback")}</span>
            </div>
          )}
          <span className="u-mark">OPENSTORE DZ — {config.index}</span>
        </div>
      </div>
    </section>
  );
}

export function CrossUniverses({ universe }: { universe: UniverseKey }) {
  const { t } = useI18n();
  return (
    <section aria-label={t("universe.cross")}>
      <div className="pt-14">
        <p className="store-eyebrow">{t("universe.cross")}</p>
      </div>
      <nav className="store-cross-universes" aria-label={t("universe.cross")}>
        {UNIVERSES.filter((entry) => entry.key !== universe).map((entry) => (
          <Link key={entry.key} to={entry.to} className="store-cross-card">
            <span>{t(entry.labelKey)}</span>
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        ))}
      </nav>
    </section>
  );
}
