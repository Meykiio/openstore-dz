import { useMemo, useState } from "react";
import { PackageSearch } from "lucide-react";
import { ProductGrid } from "./product-card";
import { CatalogueToolbar } from "./catalogue-toolbar";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState, ErrorState, ProductSkeleton } from "@/components/ui/feedback";
import { useI18n } from "@/lib/i18n-context";
import { EMPTY_FILTERS, useCataloguePage, type CatalogueFilters } from "@/lib/catalogue";
import { useDebouncedValue } from "@/lib/use-debounced";
import { isEmptyDatabaseError } from "@/lib/supabase/health";
import { SetupCheck } from "@/components/setup-check";

/**
 * A browsable catalogue: heading, filters, grid, pages.
 *
 * Shared by the category page and the search page so the two cannot drift into
 * two different shopping experiences. It owns its query because filtering and
 * paging happen in the database: a component that receives a list can only ever
 * filter the list it was given.
 */
export function CatalogueView({
  heading,
  subheading,
  eyebrow,
  initialFilters,
  emptyTitle,
  emptyBody,
}: {
  heading: string;
  subheading?: string;
  eyebrow?: string;
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

  const debouncedMin = useDebouncedValue(filters.minPrice);
  const debouncedMax = useDebouncedValue(filters.maxPrice);
  const effectiveFilters = useMemo(
    () => ({ ...filters, minPrice: debouncedMin, maxPrice: debouncedMax }),
    [filters, debouncedMin, debouncedMax],
  );

  const catalogue = useCataloguePage(effectiveFilters, page);
  const products = catalogue.data?.products ?? [];
  const facets = catalogue.data?.facets ?? { sizes: [], colors: [], priceMin: 0, priceMax: 0 };
  const total = catalogue.data?.total ?? 0;

  const applyFilters = (next: CatalogueFilters) => {
    setFilters(next);
    setPage(1);
  };

  const goToPage = (next: number) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col">
      <header className="store-page-head">
        <p className="store-eyebrow">{eyebrow ?? t("catalogue.eyebrow")}</p>
        <div className="store-page-head-row">
          <h1 className="store-display store-page-title">{heading}</h1>
          <span className="store-page-count">{t("catalogue.resultsCount", { count: total })}</span>
        </div>
        {subheading && <p className="store-page-lede">{subheading}</p>}
      </header>

      <CatalogueToolbar
        filters={filters}
        onChange={applyFilters}
        sizes={facets.sizes}
        colors={facets.colors}
        priceMin={facets.priceMin}
        priceMax={facets.priceMax}
      />

      <div className="py-10">
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
    </div>
  );
}

function CatalogueLoading() {
  return (
    <div className="product-grid">
      {Array.from({ length: 8 }, (_, index) => (
        <ProductSkeleton key={index} />
      ))}
    </div>
  );
}

function CatalogueError({ message, onRetry }: { message: string; onRetry: () => void }) {
  if (isEmptyDatabaseError({ message })) return <SetupCheck className="mx-auto" />;
  return <ErrorState message={message} onRetry={onRetry} />;
}
