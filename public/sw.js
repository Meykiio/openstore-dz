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
 *   - Everything else same-origin (product photos, the logo, icons) is left to
 *     the browser's HTTP cache, which revalidates it. Product photos keep their
 *     names when they are re-shot, so caching them here served old photos until
 *     a hard refresh (fixed 2026-10-30, with the version bump below).
 *   - Anything cross-origin (Supabase, product images on another host) is never
 *     cached. Prices and stock must not come from a cache we control.
 *
 * Registered only in production — see the registration in `__root.tsx`, because
 * a service worker in front of the dev server causes confusing stale modules.
 */

// Bumping the version deletes every older cache on activation. Keep the
// "openstore" prefix; change only the number.
const VERSION = "openstore-v2";
const SHELL_CACHE = `${VERSION}-shell`;
const ASSET_CACHE = `${VERSION}-assets`;

/** Immutable, content-hashed build output. */
const ASSET_PATTERN = /\/(_build|assets|build)\//;

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

  if (ASSET_PATTERN.test(url.pathname)) {
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
