import { Link, createFileRoute } from "@tanstack/react-router";
import { StoreLayout } from "@/components/storefront/store-layout";
import { ProductGrid } from "@/components/storefront/product-card";
import { HomeHero, TrustBar } from "@/components/storefront/home-hero";
import {
  CategoryStrip,
  ClosingCta,
  PromoBand,
  ReviewWall,
} from "@/components/storefront/home-sections";
import { ErrorState, NoProducts, ProductSkeleton } from "@/components/ui/feedback";
import { SetupCheck } from "@/components/setup-check";
import { supabaseConfigProblem } from "@/lib/supabase/client";
import { reviewsQuery, storeSettingsQuery } from "@/lib/queries";
import { EMPTY_FILTERS, cataloguePageQuery, useCataloguePage } from "@/lib/catalogue";
import { useI18n } from "@/lib/i18n-context";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    // Prefetch both so SSR emits the store name and the catalogue instead of an
    // empty shell. Failures are swallowed: a missing database must render the
    // setup guidance, not a 500.
    const settings = await context.queryClient
      .ensureQueryData(storeSettingsQuery())
      .catch(() => null);
    await Promise.all([
      // Reviews feed the testimonial wall below the fold. Fetching them during
      // SSR avoids a visible pop-in and lets crawlers see the social proof.
      context.queryClient.ensureQueryData(reviewsQuery()).catch(() => null),
      // The product grid is the page. Without this the server HTML ships an
      // empty grid and the buyer waits for the browser to fill it in.
      context.queryClient.ensureQueryData(cataloguePageQuery(EMPTY_FILTERS, 1)).catch(() => null),
    ]);
    return { settings };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.settings?.name?.trim();
    const tagline = loaderData?.settings?.tagline?.trim();
    const title = name ? `${name}${tagline ? ` — ${tagline}` : ""}` : "متجر إلكتروني";
    const description =
      loaderData?.settings?.description?.trim() ||
      "تسوق أونلاين مع الدفع عند الاستلام والتوصيل إلى 58 ولاية.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
      ],
    };
  },
  component: Home,
});

function Home() {
  const { t } = useI18n();
  const { settings } = Route.useLoaderData();
  const catalogue = useCataloguePage(EMPTY_FILTERS, 1);
  const configProblem = supabaseConfigProblem();

  // A shop that has not been connected to a database yet must see the setup
  // instructions, not an error boundary. This is the first screen a new owner
  // ever loads, so it has to be the most forgiving one.
  if (configProblem) {
    return (
      <main className="container-page flex min-h-dvh flex-col items-center justify-center gap-6 py-20 text-center">
        <h1 className="font-display text-3xl font-semibold">{settings?.name ?? "OpenStore DZ"}</h1>
        <SetupCheck />
      </main>
    );
  }

  const list = catalogue.data?.products ?? [];
  const catalogueTotal = catalogue.data?.total ?? 0;
  const featured = list[0] ?? null;

  return (
    <StoreLayout>
      <HomeHero settings={settings} featured={featured} />
      <TrustBar returnsDays={settings?.returns_days ?? 14} />

      <section id="catalogue" className="container-page scroll-mt-20 py-12">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="section-label">{t("home.featured")}</span>
            <h2 className="mt-2 font-display text-xl font-semibold sm:text-2xl">{t("nav.shop")}</h2>
          </div>
          {catalogueTotal > 0 && (
            <Link
              to="/catalogue"
              className="inline-flex min-h-9 items-center text-sm text-primary hover:underline"
            >
              {t("store.productCount", { count: catalogueTotal })}
            </Link>
          )}
        </div>

        {catalogue.isPending ? (
          <div className="product-grid">
            {Array.from({ length: 6 }, (_, index) => (
              <ProductSkeleton key={index} />
            ))}
          </div>
        ) : catalogue.isError ? (
          <div className="mx-auto flex max-w-xl flex-col gap-4">
            <ErrorState
              message={catalogue.error.message}
              onRetry={() => void catalogue.refetch()}
            />
            <SetupCheck />
          </div>
        ) : list.length === 0 ? (
          <NoProducts />
        ) : (
          <ProductGrid products={list} />
        )}
      </section>

      <CategoryStrip />
      <PromoBand threshold={settings?.free_shipping_threshold ?? 0} />
      <ReviewWall />
      <ClosingCta storeName={settings?.name ?? "OpenStore DZ"} />
    </StoreLayout>
  );
}
