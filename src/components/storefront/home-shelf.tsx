import { Link, useRouterState } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n-context";
import { localized } from "@/lib/i18n";
import { useCategories } from "@/lib/queries";
import { UNIVERSES } from "@/lib/universes";

/**
 * The storefront's two-axis navigation, repeated on catalogue pages.
 *
 * The shop sells along two axes and buyers use both: "a hoodie" (piece type) and
 * "an Anime one" (universe). The universe row is the shop's primary structure
 * and is always present; the category row is real data, so a category an owner
 * adds in the admin appears here without a code change. A category with no
 * published product is a dead end and is not offered.
 */
export function CategoryChips() {
  const { t, locale } = useI18n();
  const { data: categories } = useCategories();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const visible = (categories ?? []).filter((category) => category.product_count > 0);
  const onAll = pathname === "/catalogue";

  return (
    <section className="store-subnav" aria-label={t("home.categories")}>
      <div className="container-page">
        <nav className="store-subnav-row" aria-label={t("home.universes.title")}>
          <span className="store-subnav-label">{t("home.universes.title")}</span>
          {UNIVERSES.map((universe) => {
            const active = pathname === universe.to;
            return (
              <Link
                key={universe.key}
                to={universe.to}
                className="store-chip"
                data-active={active || undefined}
                aria-current={active ? "page" : undefined}
              >
                {t(universe.labelKey)}
              </Link>
            );
          })}
        </nav>

        {visible.length > 0 && (
          <nav className="store-subnav-row" aria-label={t("home.categories")}>
            <span className="store-subnav-label">{t("home.categories")}</span>
            <Link
              to="/catalogue"
              className="store-chip"
              data-active={onAll || undefined}
              aria-current={onAll ? "page" : undefined}
            >
              {t("catalogue.all")}
            </Link>
            {visible.map((category) => {
              const active = pathname === `/category/${category.slug}`;
              return (
                <Link
                  key={category.id}
                  to="/category/$slug"
                  params={{ slug: category.slug }}
                  className="store-chip"
                  data-active={active || undefined}
                  aria-current={active ? "page" : undefined}
                >
                  {localized(locale, category.name, category.name_fr)}
                  <b>{category.product_count}</b>
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </section>
  );
}
