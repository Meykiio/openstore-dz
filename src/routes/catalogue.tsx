import { createFileRoute } from "@tanstack/react-router";
import { StoreLayout } from "@/components/storefront/store-layout";
import { CatalogueView } from "@/components/storefront/catalogue-view";
import { CategoryChips } from "@/components/storefront/home-shelf";
import { EMPTY_FILTERS, cataloguePageQuery } from "@/lib/catalogue";
import { translate } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n-context";

export const Route = createFileRoute("/catalogue")({
  loader: async ({ context }) => {
    await context.queryClient
      .ensureQueryData(cataloguePageQuery(EMPTY_FILTERS, 1))
      .catch(() => null);
  },
  head: ({ match }) => ({
    meta: [
      { title: translate(match.context.locale, "nav.products") },
      {
        name: "description",
        content: translate(match.context.locale, "catalogue.description"),
      },
    ],
  }),
  component: CatalogueRoute,
});

/** The whole catalogue, unfiltered and paged. */
function CatalogueRoute() {
  const { t } = useI18n();

  return (
    <StoreLayout>
      <CategoryChips />
      <div className="container-page pb-16">
        <CatalogueView
          heading={t("nav.products")}
          eyebrow={t("catalogue.eyebrow")}
          subheading={t("catalogue.description")}
        />
      </div>
    </StoreLayout>
  );
}
