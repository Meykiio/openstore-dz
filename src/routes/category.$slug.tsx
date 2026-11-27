import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { StoreLayout } from "@/components/storefront/store-layout";
import { CatalogueView } from "@/components/storefront/catalogue-view";
import { CategoryChips } from "@/components/storefront/home-shelf";
import { useI18n } from "@/lib/i18n-context";
import { categoriesQuery, useCategories } from "@/lib/queries";
import { localized } from "@/lib/i18n";
import { EMPTY_FILTERS, cataloguePageQuery } from "@/lib/catalogue";

export const Route = createFileRoute("/category/$slug")({
  loader: async ({ context, params }) => {
    const categories = await context.queryClient.ensureQueryData(categoriesQuery()).catch(() => []);
    const category = categories.find((entry) => entry.slug === params.slug);
    if (!category) throw notFound();
    await context.queryClient
      .ensureQueryData(cataloguePageQuery({ ...EMPTY_FILTERS, categorySlug: category.slug }, 1))
      .catch(() => null);
    return { category };
  },
  head: ({ loaderData, match }) => {
    const category = loaderData?.category;
    if (!category) return { meta: [{ title: "OpenStore DZ" }] };
    const name = localized(match.context.locale, category.name, category.name_fr);
    const title = `${name} | OpenStore DZ`;
    const description = category.description?.trim() || title;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { category } = Route.useLoaderData();
  const { t, locale } = useI18n();
  const { data: categories } = useCategories();

  const others = (categories ?? []).filter(
    (entry) => entry.slug !== category.slug && entry.product_count > 0,
  );

  const heading = localized(locale, category.name, category.name_fr);

  return (
    <StoreLayout>
      <CategoryChips />
      <div className="container-page pb-16">
        <CatalogueView
          heading={heading}
          eyebrow={t("catalogue.collection")}
          subheading={category.description ?? undefined}
          initialFilters={{ ...EMPTY_FILTERS, categorySlug: category.slug }}
        />

        {others.length > 0 && (
          <nav
            className="mt-10 flex flex-col gap-3 border-t border-outline pt-8"
            aria-label={t("home.categories")}
          >
            <h2 className="store-eyebrow">{t("home.categories")}</h2>
            <div className="flex flex-wrap gap-2">
              {others.map((entry) => (
                <Link
                  key={entry.id}
                  to="/category/$slug"
                  params={{ slug: entry.slug }}
                  className="store-chip"
                >
                  {localized(locale, entry.name, entry.name_fr)}
                  <b>{entry.product_count}</b>
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </StoreLayout>
  );
}
