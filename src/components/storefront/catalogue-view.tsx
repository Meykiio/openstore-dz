import { useMemo, useState } from "react";
import { PackageSearch } from "lucide-react";
import { ProductGrid } from "./product-card";
import { CatalogueToolbar } from "./catalogue-toolbar";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState, ErrorState, ProductSkeleton } from "@/components/ui/feedback";
import { useI18n } from "@/lib/i18n-context";
import { EMPTY_FILTERS, useCataloguePage, type CatalogueFilters } from "@/lib/catalogue";
import { useDebouncedValue } from "@/lib/use-debounced";

/**
 * A browsable catalogue: heading, filters, grid, pages.
 *
 * Shared by the category page and the search page so the two cannot drift into two
 * different shopping experiences. It owns its query rather than receiving
 * products, because filtering and paging happen in the database now: a component
 * that receives a list can only ever filter the list it was given, which is the
 * bug this replaced.
 *
 * Filter state is local because it is a view concern. Changing a filter resets to
 * page one, because staying on page 4 of a different result set shows nothing.
 */
export function CatalogueView({
  heading,
  subheading,
  initialFilters,
  emptyTitle,
  emptyBody,
}: {
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
  const [page, setPage] = useState(1);

  // Only the price fields are debounced. They are text inputs, so every keystroke
  // would otherwise be a query. Chips and sort change once per interaction and
  // stay immediate.
  const debouncedMin = useDebouncedValue(filters.minPrice);
  const debouncedMax = useDebouncedValue(filters.maxPrice);
  const effectiveFilters = useMemo(
    () => ({ ...filters, minPrice: debouncedMin, maxPrice: debouncedMax }),
    [filters, debouncedMin, debouncedMax],
  );

  const catalogue = useCataloguePage(effectiveFilters, page);
  const products = catalogue.data?.products ?? [];
  const facets = catalogue.data?.facets ?? { sizes: [], colors: [], priceMin: 0, priceMax: 0 };

  const applyFilters = (next: CatalogueFilters) => {
    setFilters(next);
    setPage(1);
  };

  const goToPage = (next: number) => {
    setPage(next);
    // A page change is a new set of products, so the buyer should start at the top
    // rather than halfway down the previous page's scroll position.
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">{heading}</h1>
        {subheading && <p className="max-w-2xl text-sm text-on-surface-muted">{subheading}</p>}
      </header>

      <CatalogueToolbar
        filters={filters}
        onChange={applyFilters}
        sizes={facets.sizes}
        colors={facets.colors}
        priceMin={facets.priceMin}
        priceMax={facets.priceMax}
        resultCount={catalogue.data?.total ?? 0}
      />

      {catalogue.isPending ? (
        <CatalogueLoading />
      ) : catalogue.isError ? (
        <CatalogueError
          message={catalogue.error.message}
          onRetry={() => void catalogue.refetch()}
        />
      ) : products.length === 0 ? (
        <EmptyState
          icon={<PackageSearch size={28} />}
          title={emptyTitle ?? t("catalogue.noResults")}
          body={emptyBody ?? t("catalogue.noResultsBody")}
        />
      ) : (
        <>
          <ProductGrid products={products} />
          <Pagination
            page={page}
            pageCount={catalogue.data?.pageCount ?? 1}
            onPageChange={goToPage}
            testId="catalogue-pagination"
          />
        </>
      )}
    </div>
  );
}

/** Loading and error wrappers so both catalogue pages behave identically. */
function CatalogueLoading() {
  return (
    <div className="product-grid">
      {Array.from({ length: 6 }, (_, index) => (
        <ProductSkeleton key={index} />
      ))}
    </div>
  );
}

function CatalogueError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <ErrorState message={message} onRetry={onRetry} />;
}
