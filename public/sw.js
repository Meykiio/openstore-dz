/*
 * OpenStore service worker.
 *
 * Deliberately conservative. A storefront that serves a stale price or a stale
 * basket is worse than one that requires a connection, so:
 *
 *   - Navigations are NETWORK-FIRST. The network always wins when it answers;
 *     the cache is only an offline fallback.
 *   - Hashed build assets are CACHE-FIRST. Their names change when their
 *     contents do, so serving them from cache cannot go stale.
 *   - Anything cross-origin (Supabase, product images on another host) is never
 *     cached. Prices and stock must not come from a cache we control.
 *
 * Registered only in production — see the registration in `__root.tsx`, because
 * a service worker in front of the dev server causes confusing stale modules.
 */

const VERSION = "openstore-v1";
const SHELL_CACHE = `${VERSION}-shell`;
const ASSET_CACHE = `${VERSION}-assets`;

/** Immutable, content-hashed build output. */
const ASSET_PATTERN = /\/(_build|assets|build)\//;
const STATIC_PATTERN = /\.(?:js|css|woff2?|ttf|otf|png|jpg|jpeg|webp|avif|svg|ico)$/i;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(["/", "/track"]).catch(() => undefined)),
  );
  // Take over as soon as the new worker is installed rather than waiting for
  // every tab to close; this is a storefront, not a long-lived session app.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only GET, and only same-origin. Cross-origin means Supabase or a media CDN,
  // and neither should ever be answered from our cache.
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (ASSET_PATTERN.test(url.pathname) || STATIC_PATTERN.test(url.pathname)) {
    event.respondWith(cacheFirstAsset(request));
  }
});

async function networkFirstNavigation(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = (await cache.match(request)) ?? (await cache.match("/"));
    if (cached) return cached;
    return new Response(
      "<!doctype html><meta charset=utf-8><title>غير متصل</title><p>لا يوجد اتصال بالإنترنت.",
      { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }
}

async function cacheFirstAsset(request) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  // Opaque or error responses must not poison the cache.
  if (response && response.ok && response.type === "basic") {
    cache.put(request, response.clone());
  }
  return response;
}
