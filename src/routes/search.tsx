import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search as SearchIcon } from "lucide-react";
import { StoreLayout } from "@/components/storefront/store-layout";
import { CatalogueView } from "@/components/storefront/catalogue-view";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { useI18n } from "@/lib/i18n-context";
import { useProducts } from "@/lib/queries";
import { EMPTY_FILTERS, normalizeArabic } from "@/lib/catalogue";

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): { q?: string } => ({
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  head: () => ({ meta: [{ title: "البحث" }, { name: "robots", content: "noindex" }] }),
  component: SearchPage,
});

/**
 * Search page.
 *
 * The query lives in the URL rather than in component state, so a search result
 * can be shared, bookmarked, and survives a back navigation. Filtering is then
 * handled by the shared CatalogueView, which means search and a category page
 * cannot diverge.
 */
function SearchPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { q } = Route.useSearch();
  const { data: products, isPending } = useProducts();
  const [draft, setDraft] = useState(q ?? "");

  const query = (q ?? "").trim();
  const hasQuery = normalizeArabic(query).length > 0;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    void navigate({ to: "/search", search: { q: draft.trim() || undefined } });
  };

  return (
    <StoreLayout>
      <div className="container-page py-10">
        <form onSubmit={submit} className="mb-8 flex flex-wrap items-end gap-3">
          <Field label={t("search.title")} className="min-w-64 flex-1">
            <Input
              type="search"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={t("search.placeholder")}
              autoFocus
              maxLength={100}
            />
          </Field>
          <Button type="submit" className="mb-0.5">
            <SearchIcon size={16} aria-hidden="true" />
            {t("nav.search")}
          </Button>
        </form>

        {hasQuery && !isPending && (
          <CatalogueView
            products={products ?? []}
            heading={`${t("search.for")} "${query}"`}
            initialFilters={{ ...EMPTY_FILTERS, query }}
          />
        )}

        {!hasQuery && (
          <p className="py-16 text-center text-sm text-on-surface-muted">
            {t("search.placeholder")}
          </p>
        )}
      </div>
    </StoreLayout>
  );
}
