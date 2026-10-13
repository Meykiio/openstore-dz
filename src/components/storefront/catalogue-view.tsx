import { useMemo, useState } from "react";
import { PackageSearch } from "lucide-react";
import { ProductGrid } from "./product-card";
import { CatalogueToolbar } from "./catalogue-toolbar";
import { EmptyState, ErrorState, ProductSkeleton } from "@/components/ui/feedback";
import { useI18n } from "@/lib/i18n-context";
import type { CatalogueProduct } from "@/lib/queries";
import {
  applyCatalogueFilters,
  facetsFor,
  EMPTY_FILTERS,
  type CatalogueFilters,
} from "@/lib/catalogue";

/**
 * A browsable catalogue: heading, filters, grid.
 *
 * Shared by the category page and the search page so the two cannot drift into
 * two different shopping experiences. Filter state is local because it is a view
 * concern, not something a buyer needs in their history on these pages.
 */
export function CatalogueView({
  products,
  heading,
  subheading,
  initialFilters,
  emptyTitle,
  emptyBody,
}: {
  products: CatalogueProduct[];
  heading: string;
  subheading?: string;
  initialFilters?: Partial<CatalogueFilters>;
  emptyTitle?: string;
  emptyBody?: string;
}) {
  const { t } = useI18n();
  const [filters, setFilters] = useState<CatalogueFilters>({
    ...EMPTY_FILTERS,
    ...initialFilters,
  });

  const facets = useMemo(() => facetsFor(products), [products]);
  const visible = useMemo(() => applyCatalogueFilters(products, filters), [products, filters]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">{heading}</h1>
        {subheading && <p className="max-w-2xl text-sm text-on-surface-muted">{subheading}</p>}
      </header>

      <CatalogueToolbar
        filters={filters}
        onChange={setFilters}
        sizes={facets.sizes}
        colors={facets.colors}
        priceMin={facets.priceMin}
        priceMax={facets.priceMax}
        resultCount={visible.length}
      />

      {visible.length === 0 ? (
        <EmptyState
          icon={<PackageSearch size={28} />}
          title={emptyTitle ?? t("catalogue.noResults")}
          body={emptyBody ?? t("catalogue.noResultsBody")}
        />
      ) : (
        <ProductGrid products={visible} />
      )}
    </div>
  );
}

/** Loading and error wrappers so both catalogue pages behave identically. */
export function CatalogueLoading() {
  return (
    <div className="product-grid">
      {Array.from({ length: 6 }, (_, index) => (
        <ProductSkeleton key={index} />
      ))}
    </div>
  );
}

export function CatalogueError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <ErrorState message={message} onRetry={onRetry} />;
}
