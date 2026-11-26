import { Link, useRouterState } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n-context";
import { localized } from "@/lib/i18n";
import { useCategories, type CatalogueProduct } from "@/lib/queries";
import { ProductGrid } from "./product-card";

/**
 * The two rails at the top of the shop, and the shelf beneath them.
 *
 * The shop sells along two axes, and buyers use both: "a hoodie" (garment) and
 * "an Anime one" (universe). The garment axis is real data — every category in
 * the table becomes a chip, so the owner adds a category in the admin and it
 * appears here without a code change. The universe axis is a search, because a
 * product belongs to one category only (`products.category_id`), and inventing
 * a second taxonomy would mean a migration for something the catalogue search
 * already does.
 *
 * A universe chip is only shown when the feed contains a product whose name
 * matches it. A chip that lands on "no results" is worse than no chip, and this
 * shop is a demonstration of the platform: it may be seeded with plain garments.
 */

const UNIVERSES = [
  { q: "Anime", key: "home.universe.anime" },
  { q: "DZ", key: "home.universe.clubs" },
  { q: "Europe", key: "home.universe.europe" },
  { q: "Streetwear", key: "home.universe.streetwear" },
] as const;

const chipScroll = "shrink-0";

export function CategoryChips({ products = [] }: { products?: CatalogueProduct[] }) {
  const { t, locale } = useI18n();
  const { data: categories } = useCategories();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  // A category with no published product is a dead end, so it is not offered.
  const visible = (categories ?? []).filter((category) => category.product_count > 0);

  // Only universes this catalogue can answer. Matching is on the product name,
  // which is the one field every shop already fills.
  const universes = UNIVERSES.filter((universe) =>
    products.some((product) =>
      `${product.name} ${product.name_fr ?? ""}`.toLowerCase().includes(universe.q.toLowerCase()),
    ),
  );

  const onAll = pathname === "/catalogue";

  // A shop with no categories and no matching universes gets no band at all; an
  // empty bordered strip reads as a broken component, not as a calm page.
  if (universes.length === 0 && visible.length === 0) return null;

  return (
    <section className="border-b border-outline bg-surface">
      <div className="container-page flex flex-col gap-2.5 py-4">
        {universes.length > 0 && (
          <nav
            className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label={t("nav.search")}
          >
            {universes.map((universe) => (
              <Link
                key={universe.q}
                to="/search"
                search={{ q: universe.q }}
                className={`chip filled ${chipScroll}`}
              >
                {t(universe.key)}
              </Link>
            ))}
          </nav>
        )}

        {visible.length > 0 && (
          <nav
            className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label={t("home.categories")}
          >
            <Link
              to="/catalogue"
              className={`chip ${chipScroll}`}
              aria-current={onAll ? "page" : undefined}
              data-active={onAll || undefined}
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
                  className={`chip ${chipScroll}`}
                  aria-current={active ? "page" : undefined}
                  data-active={active || undefined}
                >
                  {localized(locale, category.name, category.name_fr)}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </section>
  );
}

/**
 * One shelf: a heading, a "view all" link, and one row of products on desktop.
 *
 * Three rather than twelve on purpose. A shelf is a doorway, not a listing; the
 * category page is where the whole range lives.
 */
export function ProductShelf({
  id,
  title,
  products,
  categorySlug,
}: {
  id?: string;
  title: string;
  products: CatalogueProduct[];
  categorySlug?: string;
}) {
  const { t } = useI18n();
  if (products.length === 0) return null;

  return (
    <section id={id} className="container-page scroll-mt-20 py-9 sm:py-11">
      <div className="mb-5 flex items-end justify-between gap-4 border-b border-outline pb-3">
        <h2 className="section-title text-xl sm:text-2xl">{title}</h2>
        {categorySlug ? (
          <Link
            to="/category/$slug"
            params={{ slug: categorySlug }}
            className="shrink-0 text-sm font-medium text-secondary underline-offset-4 hover:underline"
          >
            {t("home.viewAll")}
          </Link>
        ) : (
          <Link
            to="/catalogue"
            className="shrink-0 text-sm font-medium text-secondary underline-offset-4 hover:underline"
          >
            {t("home.viewAll")}
          </Link>
        )}
      </div>

      <ProductGrid products={products} />
    </section>
  );
}
