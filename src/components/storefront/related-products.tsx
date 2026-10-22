import { EMPTY_FILTERS, useCataloguePage } from "@/lib/catalogue";
import { useI18n } from "@/lib/i18n-context";
import type { CatalogueProduct } from "@/lib/queries";
import { ProductGrid } from "./product-card";

/**
 * More from the same category, or the newest products when the category has
 * nothing else, so a buyer who does not want this one has somewhere to go.
 * Reuses the catalogue's own query, so it shows what the category page would,
 * minus the product on screen.
 */
export function RelatedProducts({ product }: { product: CatalogueProduct }) {
  const { t } = useI18n();
  const sameCategory = useCataloguePage(
    { ...EMPTY_FILTERS, categorySlug: product.categories?.slug ?? null },
    1,
  );
  // A category of one has nothing to suggest, so fall back to the newest
  // products in the shop. Usually already cached from the home page.
  const newest = useCataloguePage(EMPTY_FILTERS, 1);
  const without = (list: CatalogueProduct[] | undefined) =>
    (list ?? []).filter((p) => p.id !== product.id).slice(0, 4);
  const fromCategory = without(sameCategory.data?.products);
  const others = fromCategory.length > 0 ? fromCategory : without(newest.data?.products);
  if (others.length === 0) return null;

  return (
    <section className="flex flex-col gap-5" aria-labelledby="related-title">
      <h2 id="related-title" className="font-display text-xl font-semibold">
        {t("store.related")}
      </h2>
      <ProductGrid products={others} />
    </section>
  );
}
