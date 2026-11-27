import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search as SearchIcon } from "lucide-react";
import { StoreLayout } from "@/components/storefront/store-layout";
import { CatalogueView } from "@/components/storefront/catalogue-view";
import { Field, Input } from "@/components/ui/form";
import { translate } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n-context";
import { EMPTY_FILTERS, cataloguePageQuery } from "@/lib/catalogue";

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): { q?: string } => ({
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  loaderDeps: ({ search }) => ({ q: search.q ?? "" }),
  loader: async ({ context, deps }) => {
    if (!deps.q.trim()) return;
    await context.queryClient
      .ensureQueryData(cataloguePageQuery({ ...EMPTY_FILTERS, query: deps.q }, 1))
      .catch(() => null);
  },
  head: ({ match }) => ({
    meta: [
      { title: translate(match.context.locale, "search.title") },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SearchPage,
});

/**
 * Search page.
 *
 * The query lives in the URL rather than in component state, so a result can be
 * shared, bookmarked, and survives a back navigation. The results then use the
 * shared CatalogueView, which means search and a category page cannot diverge.
 */
function SearchPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { q } = Route.useSearch();
  const [draft, setDraft] = useState(q ?? "");

  const query = (q ?? "").trim();
  const hasQuery = query.length > 0;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    void navigate({ to: "/search", search: { q: draft.trim() || undefined } });
  };

  return (
    <StoreLayout>
      <div className="container-page pb-16">
        <form
          onSubmit={submit}
          className="flex flex-wrap items-end gap-3 border-b border-outline py-8"
        >
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
          <button type="submit" className="store-btn store-btn--fill">
            <SearchIcon size={16} aria-hidden="true" />
            {t("nav.search")}
          </button>
        </form>

        {hasQuery ? (
          <CatalogueView
            heading={`${t("search.for")} "${query}"`}
            eyebrow={t("nav.search")}
            initialFilters={{ ...EMPTY_FILTERS, query }}
          />
        ) : (
          <div className="store-universe-empty">
            <p className="store-eyebrow mx-auto">{t("nav.search")}</p>
            <h2>{t("search.title")}</h2>
            <p>{t("search.placeholder")}</p>
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
