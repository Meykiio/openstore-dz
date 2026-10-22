import { useEffect } from "react";

/**
 * Registers the service worker, in production only.
 *
 * In development a service worker sits between the dev server and the browser
 * and serves stale modules, which produces "my change did nothing" bugs that
 * cost far more time than the worker saves. `import.meta.env.PROD` is false
 * under `vite dev`, so this is a no-op there.
 *
 * Failures are swallowed: offline support is an enhancement, and a storefront
 * that refuses to boot because registration failed is a worse outcome.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!import.meta.env.PROD) return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
