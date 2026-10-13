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

import { themeBootstrapScript } from "@/lib/theme";
import { localeBootstrapScript } from "@/lib/i18n";
import { I18nProvider } from "@/lib/i18n-context";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { Button } from "@/components/ui/button";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#047857" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
    ],
    scripts: [{ children: themeBootstrapScript }, { children: localeBootstrapScript }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  errorComponent: RouteError,
  notFoundComponent: NotFound,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    // Arabic and RTL are the server default; the locale bootstrap script flips
    // both before paint if the visitor chose another language.
    <html lang="ar" dir="rtl" data-theme="light" suppressHydrationWarning>
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
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AuthProvider>
          <CartProvider>
            <Outlet />
            <Toaster position="top-center" richColors closeButton />
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
  const message =
    error instanceof Error && error.message ? error.message : "تعذّر تحميل هذه الصفحة.";
  return (
    <main className="container-page flex min-h-dvh flex-col items-center justify-center gap-4 py-20 text-center">
      <AlertTriangle size={32} className="text-error" aria-hidden="true" />
      <h1 className="text-2xl font-semibold">حدث خطأ</h1>
      <p className="max-w-md break-words text-on-surface-muted">{message}</p>
      <Button onClick={() => (reset ? reset() : window.location.reload())}>إعادة المحاولة</Button>
    </main>
  );
}

function NotFound() {
  return (
    <main className="container-page flex min-h-dvh flex-col items-center justify-center gap-4 py-20 text-center">
      <p className="font-mono text-5xl font-semibold text-on-surface-muted">404</p>
      <h1 className="text-2xl font-semibold">الصفحة غير موجودة</h1>
      <p className="max-w-md text-on-surface-muted">
        الرابط الذي فتحته غير صحيح أو أن الصفحة تم حذفها.
      </p>
      <Button asChild>
        <a href="/">العودة إلى المتجر</a>
      </Button>
    </main>
  );
}
