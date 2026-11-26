import { createFileRoute } from "@tanstack/react-router";
import { StoreLayout } from "@/components/storefront/store-layout";
import { HomeHero, TrustBar } from "@/components/storefront/home-hero";
import { CategoryChips, ProductShelf } from "@/components/storefront/home-shelf";
import { ClosingCta, PromoBand, ReviewWall, Ticker } from "@/components/storefront/home-sections";
import { ErrorState, NoProducts, ProductSkeleton } from "@/components/ui/feedback";
import { SetupCheck } from "@/components/setup-check";
import { isEmptyDatabaseError } from "@/lib/supabase/health";
import { supabaseConfigProblem } from "@/lib/supabase/client";
import { localized } from "@/lib/i18n";
import { reviewsQuery, storeSettingsQuery, useCategories } from "@/lib/queries";
import { homeFeedQuery, useHomeFeed } from "@/lib/catalogue";
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
      // One feed feeds the hero, the chips and every shelf. Without this the
      // server HTML ships an empty page and the buyer waits for the browser.
      context.queryClient.ensureQueryData(homeFeedQuery()).catch(() => null),
    ]);
    return { settings };
  },
  head: ({ loaderData, match }) => {
    const s = loaderData?.settings;
    const ar = match.context.locale === "ar";
    const name = s?.name?.trim();
    const tagline = (ar ? s?.tagline : s?.tagline_fr)?.trim();
    // Some owners sign the tagline with the shop name. Prefixing the name too
    // produced titles like "DZ WEAR — NOTRE IDENTITÉ — DZ WEAR".
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
 * Home page: hero, bulletin, trust bar, two rails, then shelves.
 *
 * The shop sells on two axes (garment and universe), so the page leads with both
 * as rails and then shows a shelf per category. That is a change of shape from a
 * single grid: a buyer looking for "a hoodie" or "an MCA jersey" should reach it
 * in one click instead of scrolling the whole catalogue.
 *
 * A shelf is one row on desktop. Four products, not twelve: the category page is
 * where the range lives, and a home page that repeats the catalogue is a home
 * page with no point of view.
 */
function Home() {
  const { t, locale } = useI18n();
  const { settings } = Route.useLoaderData();
  const feed = useHomeFeed();
  const { data: categories } = useCategories();
  const configProblem = supabaseConfigProblem();

  // A shop that has not been connected to a database yet, or whose database is
  // still empty, must see the setup instructions, not an error boundary. This is
  // the first screen a new owner ever loads, so it has to be the most forgiving one.
  if (configProblem || (feed.isError && isEmptyDatabaseError(feed.error))) {
    return (
      <main className="container-page flex min-h-dvh flex-col items-center justify-center gap-6 py-20 text-center">
        <h1 className="font-display text-3xl font-semibold">{settings?.name ?? "OpenStore DZ"}</h1>
        <SetupCheck />
      </main>
    );
  }

  const all = feed.data ?? [];
  const newest = all.slice(0, 3);

  // A shelf earns its heading only when it has at least two products; a single
  // card under a category title reads as a broken row, and on a two-product shop
  // it repeats the same card three times down the page.
  const shelves = (categories ?? [])
    .filter((category) => category.product_count > 0)
    .slice(0, 3)
    .map((category) => ({
      category,
      products: all.filter((product) => product.category_id === category.id).slice(0, 3),
    }))
    .filter((shelf) => shelf.products.length >= 2);

  return (
    <StoreLayout>
      {/* The bulletin sits above the hero, like a shop's opening line, so it
          does not read as a divider repeating the trust bar right below it. */}
      <Ticker returnsDays={settings?.returns_days ?? 14} />
      <HomeHero settings={settings} products={newest} />
      <TrustBar returnsDays={settings?.returns_days ?? 14} />
      <CategoryChips products={all} />

      {feed.isError ? (
        <div className="mx-auto flex max-w-xl flex-col gap-4 py-12">
          <ErrorState message={feed.error.message} onRetry={() => void feed.refetch()} />
          <SetupCheck />
        </div>
      ) : feed.isPending ? (
        <div className="container-page py-10">
          <div className="product-grid">
            {Array.from({ length: 3 }, (_, index) => (
              <ProductSkeleton key={index} />
            ))}
          </div>
        </div>
      ) : all.length === 0 ? (
        <div className="container-page py-10">
          <NoProducts />
        </div>
      ) : (
        <>
          <ProductShelf id="catalogue" title={t("home.newArrivals")} products={newest} />

          {shelves.map(({ category, products }) => (
            <ProductShelf
              key={category.id}
              title={localized(locale, category.name, category.name_fr)}
              products={products}
              categorySlug={category.slug}
            />
          ))}
        </>
      )}

      <PromoBand threshold={settings?.free_shipping_threshold ?? 0} />
      <ReviewWall />
      <ClosingCta storeName={settings?.name ?? "OpenStore DZ"} />
    </StoreLayout>
  );
}
