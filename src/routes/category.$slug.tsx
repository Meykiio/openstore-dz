import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { StoreLayout } from "@/components/storefront/store-layout";
import { CatalogueView } from "@/components/storefront/catalogue-view";
import { useI18n } from "@/lib/i18n-context";
import { categoriesQuery, useCategories } from "@/lib/queries";
import { EMPTY_FILTERS, cataloguePageQuery } from "@/lib/catalogue";

export const Route = createFileRoute("/category/$slug")({
  loader: async ({ context, params }) => {
    const categories = await context.queryClient.ensureQueryData(categoriesQuery()).catch(() => []);
    const category = categories.find((entry) => entry.slug === params.slug);
    if (!category) throw notFound();
    // Prefetched so the server sends products rather than an empty grid.
    await context.queryClient
      .ensureQueryData(cataloguePageQuery({ ...EMPTY_FILTERS, categorySlug: category.slug }, 1))
      .catch(() => null);
    return { category };
  },
  head: ({ loaderData }) => {
    const category = loaderData?.category;
    if (!category) return { meta: [{ title: "الفئة غير موجودة" }] };
    const title = `${category.name} | OpenStore DZ`;
    const description =
      category.description?.trim() ||
      `تصفح ${category.name} مع الدفع عند الاستلام والتوصيل إلى ولايتك.`;
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

  const heading = locale === "fr" ? (category.name_fr ?? category.name) : category.name;

  return (
    <StoreLayout>
      <div className="container-page py-10">
        {/* The view owns its own query, loading and empty states now: filtering and
            paging happen in the database, so a component handed a list could only
            ever filter the list it was given. */}
        <CatalogueView
          heading={heading}
          subheading={category.description ?? undefined}
          initialFilters={{ ...EMPTY_FILTERS, categorySlug: category.slug }}
        />

        {/* Other categories, so a buyer who landed here from search can keep
            browsing instead of hitting a dead end. */}
        {others.length > 0 && (
          <nav
            className="mt-12 flex flex-col gap-3 border-t border-outline pt-8"
            aria-label={t("home.categories")}
          >
            <h2 className="text-sm font-semibold uppercase tracking-[0.03em] text-on-surface-muted">
              {t("home.categories")}
            </h2>
            <div className="flex flex-wrap gap-2">
              {others.map((entry) => (
                <Link
                  key={entry.id}
                  to="/category/$slug"
                  params={{ slug: entry.slug }}
                  className="chip"
                >
                  {entry.name}
                  <span className="font-mono text-xs opacity-70">{entry.product_count}</span>
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </StoreLayout>
  );
}
