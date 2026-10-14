import { createFileRoute } from "@tanstack/react-router";
import { StoreLayout } from "@/components/storefront/store-layout";
import { CatalogueView } from "@/components/storefront/catalogue-view";
import { useI18n } from "@/lib/i18n-context";

export const Route = createFileRoute("/catalogue")({
  head: () => ({
    meta: [
      { title: "المنتجات" },
      {
        name: "description",
        content: "تصفح كل منتجات المتجر مع الفرز والتصفية.",
      },
    ],
  }),
  component: CatalogueRoute,
});

/**
 * The whole catalogue, unfiltered and paged.
 *
 * Exists because the home page used to render every product in one grid. Once
 * that grid shows a page, there has to be somewhere to see the rest, and neither
 * a category page nor a search page is that place: one narrows by category and the
 * other needs a query before it shows anything.
 */
function CatalogueRoute() {
  const { t } = useI18n();

  return (
    <StoreLayout>
      <div className="container-page py-10">
        <CatalogueView heading={t("nav.products")} />
      </div>
    </StoreLayout>
  );
}
