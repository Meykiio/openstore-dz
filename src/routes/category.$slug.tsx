import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { StoreLayout } from "@/components/storefront/store-layout";
import {
  CatalogueError,
  CatalogueLoading,
  CatalogueView,
} from "@/components/storefront/catalogue-view";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { useI18n } from "@/lib/i18n-context";
import { categoriesQuery, productsQuery, useCategories, useProducts } from "@/lib/queries";

export const Route = createFileRoute("/category/$slug")({
  loader: async ({ context, params }) => {
    const [categories] = await Promise.all([
      context.queryClient.ensureQueryData(categoriesQuery()).catch(() => []),
      context.queryClient.ensureQueryData(productsQuery()).catch(() => []),
    ]);
    const category = categories.find((entry) => entry.slug === params.slug);
    if (!category) throw notFound();
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
  const { data: products, isPending, isError, error, refetch } = useProducts();
  const { data: categories } = useCategories();

  const inCategory = (products ?? []).filter(
    (product) => product.categories?.slug === category.slug,
  );
  const others = (categories ?? []).filter(
    (entry) => entry.slug !== category.slug && entry.product_count > 0,
  );

  const heading = locale === "fr" ? (category.name_fr ?? category.name) : category.name;

  return (
    <StoreLayout>
      <div className="container-page py-10">
        {isPending ? (
          <CatalogueLoading />
        ) : isError ? (
          <CatalogueError message={error.message} onRetry={() => void refetch()} />
        ) : inCategory.length === 0 ? (
          <EmptyState
            title={t("catalogue.noResults")}
            body={t("catalogue.noResultsBody")}
            action={
              <Button asChild variant="secondary">
                <Link to="/">{t("cart.emptyAction")}</Link>
              </Button>
            }
          />
        ) : (
          <CatalogueView
            products={inCategory}
            heading={heading}
            subheading={category.description ?? undefined}
          />
        )}

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
