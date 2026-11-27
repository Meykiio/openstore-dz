import { createFileRoute } from "@tanstack/react-router";
import { StoreLayout } from "@/components/storefront/store-layout";
import { HomeHero, TrustBar } from "@/components/storefront/home-hero";
import { CollectionGrid, ProductRail, UniverseGrid } from "@/components/storefront/home-rails";
import { ClosingCta, PromoBand, ReviewWall, Ticker } from "@/components/storefront/home-sections";
import { ErrorState, NoProducts, ProductSkeleton } from "@/components/ui/feedback";
import { SetupCheck } from "@/components/setup-check";
import { isEmptyDatabaseError } from "@/lib/supabase/health";
import { supabaseConfigProblem } from "@/lib/supabase/client";
import { productImage, reviewsQuery, storeSettingsQuery, useCategories } from "@/lib/queries";
import { homeFeedQuery, useHomeFeed } from "@/lib/catalogue";
import { useI18n } from "@/lib/i18n-context";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    const settings = await context.queryClient
      .ensureQueryData(storeSettingsQuery())
      .catch(() => null);
    await Promise.all([
      context.queryClient.ensureQueryData(reviewsQuery()).catch(() => null),
      context.queryClient.ensureQueryData(homeFeedQuery()).catch(() => null),
    ]);
    return { settings };
  },
  head: ({ loaderData, match }) => {
    const s = loaderData?.settings;
    const ar = match.context.locale === "ar";
    const name = s?.name?.trim();
    const tagline = (ar ? s?.tagline : s?.tagline_fr)?.trim();
    const title =
      tagline && name && tagline.toLowerCase().includes(name.toLowerCase())
        ? tagline
        : name
          ? `${name}${tagline ? ` — ${tagline}` : ""}`
          : (tagline ?? "OpenStore DZ");
    const description =
      (ar ? s?.description : s?.description_fr)?.trim() ||
      (ar
        ? "تسوق أونلاين مع الدفع عند الاستلام والتوصيل إلى 69 ولاية."
        : "Shop online, pay cash on delivery.");
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

/**
 * Home page.
 *
 * A fashion front page rather than a product dump: one editorial hero, the three
 * universes, the newest pieces, the category doorways, one decision band, then
 * social proof. Every shelf is driven by the catalogue that exists; a shelf with
 * nothing to show is omitted instead of rendered as an empty heading.
 */
function Home() {
  const { t } = useI18n();
  const { settings } = Route.useLoaderData();
  const feed = useHomeFeed();
  const { data: categories } = useCategories();
  const configProblem = supabaseConfigProblem();

  if (configProblem || (feed.isError && isEmptyDatabaseError(feed.error))) {
    return (
      <main className="store container-page flex min-h-dvh flex-col items-center justify-center gap-6 py-20 text-center">
        <h1 className="font-display text-3xl font-semibold">{settings?.name ?? "OpenStore DZ"}</h1>
        <SetupCheck />
      </main>
    );
  }

  const all = feed.data ?? [];
  const newest = all.slice(0, 8);
  const topRated = all
    .filter((product) => (product.rating_count ?? 0) > 0)
    .sort((a, b) => (b.rating_avg ?? 0) - (a.rating_avg ?? 0))
    .slice(0, 4);

  const collections = (categories ?? [])
    .filter((category) => category.product_count > 0)
    .slice(0, 4)
    .map((category) => {
      const first = all.find(
        (product) => product.category_id === category.id && productImage(product),
      );
      return {
        ...category,
        count: category.product_count,
        image: category.image_url ?? (first ? productImage(first) : null),
      };
    });

  return (
    <StoreLayout>
      <HomeHero settings={settings} products={newest} />
      <Ticker returnsDays={settings?.returns_days ?? 14} />
      <UniverseGrid products={all} />

      {feed.isError ? (
        <div className="container-page py-14">
          <div className="mx-auto flex max-w-xl flex-col gap-4">
            <ErrorState message={feed.error.message} onRetry={() => void feed.refetch()} />
            <SetupCheck />
          </div>
        </div>
      ) : feed.isPending ? (
        <div className="container-page py-14">
          <div className="product-grid">
            {Array.from({ length: 4 }, (_, index) => (
              <ProductSkeleton key={index} />
            ))}
          </div>
        </div>
      ) : all.length === 0 ? (
        <div className="container-page py-14">
          <NoProducts />
        </div>
      ) : (
        <>
          <ProductRail
            id="new"
            eyebrow={t("home.new.eyebrow")}
            title={t("home.new.title")}
            body={t("home.new.body")}
            products={newest}
          />
          <CollectionGrid collections={collections} />
          <PromoBand threshold={settings?.free_shipping_threshold ?? 0} />
          {topRated.length >= 2 && (
            <ProductRail
              eyebrow={t("home.topRated.eyebrow")}
              title={t("home.topRated.title")}
              body={t("home.topRated.body")}
              products={topRated}
            />
          )}
        </>
      )}

      <TrustBar returnsDays={settings?.returns_days ?? 14} />
      <ReviewWall />
      <ClosingCta storeName={settings?.name ?? "OpenStore DZ"} />
    </StoreLayout>
  );
}
