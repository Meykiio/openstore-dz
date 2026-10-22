import { QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext, Scripts, HeadContent } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AlertTriangle } from "lucide-react";

import "@fontsource-variable/cairo";
import "@fontsource-variable/outfit";
import "@fontsource-variable/fraunces/opsz.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "../styles.css";
import cairoArabic from "@fontsource-variable/cairo/files/cairo-arabic-wght-normal.woff2?url";
import outfitLatin from "@fontsource-variable/outfit/files/outfit-latin-wght-normal.woff2?url";
import frauncesLatin from "@fontsource-variable/fraunces/files/fraunces-latin-opsz-normal.woff2?url";

import { themeBootstrapScript } from "@/lib/theme";
import { localeBootstrapScript } from "@/lib/i18n";
import { readLocale } from "@/lib/locale-cookie";
import { I18nProvider, useI18n } from "@/lib/i18n-context";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { ServiceWorkerRegistrar } from "@/components/service-worker";
import { Button } from "@/components/ui/button";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  // Runs on the server for the first request and in the browser after, reading
  // the same cookie both times.
  beforeLoad: () => ({ locale: readLocale() }),
  head: ({ match }) => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#c2410c" },
      // Default title, overridden by whichever route matches. Without this a
      // route that forgets one — or the 404 page — ships an empty <title>, which
      // axe flags and which browsers render as the raw URL.
      { title: "OpenStore DZ" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/icon-512.png" },
      // The headline waits for its font, and the browser only finds the font
      // after the stylesheet. Preloading the fonts of the first screen, for the
      // visitor's language, lets them download alongside the page instead.
      ...fontPreloads(match.context.locale).map((href) => ({
        rel: "preload",
        as: "font",
        type: "font/woff2",
        href,
        crossOrigin: "anonymous" as const,
      })),
    ],
    scripts: [{ children: themeBootstrapScript }, { children: localeBootstrapScript }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  errorComponent: RouteError,
  notFoundComponent: NotFound,
});

function fontPreloads(locale: "ar" | "fr" | "en"): string[] {
  return locale === "ar" ? [cairoArabic] : [outfitLatin, frauncesLatin];
}

function RootShell({ children }: { children: React.ReactNode }) {
  const { locale } = Route.useRouteContext();
  return (
    // Rendered in the visitor's language from the cookie. The bootstrap script
    // still covers a first visit, before any cookie exists.
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      data-theme="light"
      suppressHydrationWarning
    >
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient, locale } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider initialLocale={locale}>
        <AuthProvider>
          <CartProvider>
            <Outlet />
            <Toaster position="top-center" richColors closeButton />
            <ServiceWorkerRegistrar />
          </CartProvider>
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

/**
 * Route error boundary.
 *
 * Shows the message the database or network actually returned, because "Invalid
 * phone" and "Variant unavailable" are actionable and "Something went wrong" is
 * not. A stack trace is never shown to a shopper.
 *
 * `error` is typed `unknown` rather than `Error` so this component stays
 * assignable to the router's `ErrorRouteComponent`: a param type must be a
 * supertype of the router's, and the router may hand over a non-Error throw.
 */
function RouteError({ error, reset }: { error: unknown; reset?: () => void }) {
  const { t } = useI18n();
  const message = error instanceof Error && error.message ? error.message : t("error.loadFailed");
  return (
    <main className="container-page flex min-h-dvh flex-col items-center justify-center gap-4 py-20 text-center">
      <AlertTriangle size={32} className="text-error" aria-hidden="true" />
      <h1 className="text-2xl font-semibold">{t("error.title")}</h1>
      <p className="max-w-md break-words text-on-surface-muted">{message}</p>
      <Button onClick={() => (reset ? reset() : window.location.reload())}>
        {t("error.retry")}
      </Button>
    </main>
  );
}

function NotFound() {
  const { t } = useI18n();
  return (
    <main className="container-page flex min-h-dvh flex-col items-center justify-center gap-4 py-20 text-center">
      <p className="font-mono text-5xl font-semibold text-on-surface-muted">404</p>
      <h1 className="text-2xl font-semibold">{t("notFound.title")}</h1>
      <p className="max-w-md text-on-surface-muted">{t("notFound.body")}</p>
      <Button asChild>
        <a href="/">{t("notFound.back")}</a>
      </Button>
    </main>
  );
}
