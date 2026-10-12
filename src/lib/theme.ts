/**
 * Theme handling.
 *
 * The reference design system switches themes with a `data-theme` attribute on
 * `<html>`, not `prefers-color-scheme`. That is deliberate: an explicit user
 * choice must win over the OS setting, and the platform must let a shop owner
 * pin a theme regardless of their buyer's device.
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

export function systemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Runs before first paint so there is no flash of the wrong theme. Injected as
 * an inline script by `__root.tsx`; kept here so the logic is testable and the
 * rule stays in one place.
 */
export const themeBootstrapScript = `(function(){try{var s=localStorage.getItem("${STORAGE_KEY}");var t=(s==="light"||s==="dark")?s:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.setAttribute("data-theme",t);}catch(e){document.documentElement.setAttribute("data-theme","light");}})();`;
