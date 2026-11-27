import { createFileRoute, notFound } from "@tanstack/react-router";
import { StoreLayout } from "@/components/storefront/store-layout";
import { AnimeCollectionPage } from "@/components/storefront/anime-collection-page";
import { translate } from "@/lib/i18n";
import { SERIES } from "@/lib/universe-series";
import { isAnimeCollection } from "@/lib/universe-sections";
import { labelFor } from "@/lib/universe-taxonomy";
import { universeFeedQuery } from "@/lib/universe-feed";
import { universeConfig } from "@/lib/universes";

export const Route = createFileRoute("/anime_/$series")({
  loader: async ({ context, params }) => {
    const series = SERIES.find((entry) => entry.key === params.series);
    if (!series || !isAnimeCollection(params.series)) throw notFound();
    await context.queryClient.ensureQueryData(universeFeedQuery()).catch(() => null);
    return { series };
  },
  head: ({ loaderData, match }) => {
    const config = universeConfig("anime");
    const title = loaderData?.series
      ? labelFor(loaderData.series, match.context.locale)
      : translate(match.context.locale, config.titleKey);
    return {
      meta: [
        { title },
        { name: "description", content: translate(match.context.locale, config.introKey) },
      ],
    };
  },
  component: AnimeCollectionRoute,
});

function AnimeCollectionRoute() {
  const { series } = Route.useParams();
  return (
    <StoreLayout>
      <AnimeCollectionPage seriesKey={series} />
    </StoreLayout>
  );
}
