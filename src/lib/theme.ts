/**
 * Theme handling.
 *
 * Switches with a `data-theme` attribute on `<html>`, not `prefers-color-scheme`
 * alone. That is deliberate: an explicit user choice must win, and a shop owner
 * may eventually want to pin a theme regardless of the buyer's device.
 *
 * LIGHT IS THE DEFAULT, ALWAYS. The reference system marks light as canonical,
 * and the storefront exists to show a seller's photography — opening it dark
 * because the visitor's phone is in dark mode misrepresents the product and is
 * not a decision the buyer made. Dark stays available behind the toggle and is
 * remembered once chosen.
 */

export type Theme = "light" | "dark";

const STORAGE_KEY = "openstore-theme";

export function readStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw === "light" || raw === "dark" ? raw : null;
}

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
}

export function persistTheme(theme: Theme) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, theme);
}

/**
 * The theme to use when the visitor has never chosen one. Always light — the OS
 * preference is intentionally not consulted here.
 */
export function defaultTheme(): Theme {
  return "light";
}

/** Stored choice if there is one, otherwise the canonical light theme. */
export function resolveTheme(): Theme {
  return readStoredTheme() ?? defaultTheme();
}

/**
 * Runs before first paint so there is no flash of the wrong theme. Injected as
 * an inline script by `__root.tsx`; kept here so the logic is testable and the
 * rule stays in one place.
 */
export const themeBootstrapScript = `(function(){try{var s=localStorage.getItem("${STORAGE_KEY}");document.documentElement.setAttribute("data-theme",(s==="light"||s==="dark")?s:"light");}catch(e){document.documentElement.setAttribute("data-theme","light");}})();`;
