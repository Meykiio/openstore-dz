import { createFileRoute } from "@tanstack/react-router";
import { StoreLayout } from "@/components/storefront/store-layout";
import { UniversePage } from "@/components/storefront/universe-page";
import { translate } from "@/lib/i18n";
import { universeFeedQuery } from "@/lib/universe-feed";
import { universeConfig } from "@/lib/universes";

export const Route = createFileRoute("/algeria-design")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(universeFeedQuery()).catch(() => null);
  },
  head: ({ match }) => {
    const config = universeConfig("algeria");
    return {
      meta: [
        { title: translate(match.context.locale, config.titleKey) },
        { name: "description", content: translate(match.context.locale, config.introKey) },
      ],
    };
  },
  component: UniverseRoute,
});

function UniverseRoute() {
  return (
    <StoreLayout>
      <UniversePage universe="algeria" />
    </StoreLayout>
  );
}
