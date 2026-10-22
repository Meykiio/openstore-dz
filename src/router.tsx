import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Catalogue data is public and changes rarely. Five minutes keeps the
        // storefront fast on a poor connection without showing stale stock.
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  // Hands what the server fetched to the browser's cache. Without it the browser
  // started empty and fetched the settings, catalogue and reviews a second time,
  // on the same thin connection, right after showing them.
  // The root route already provides the QueryClient, so it is not wrapped again.
  setupRouterSsrQueryIntegration({ router, queryClient, wrapQueryClient: false });
  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
