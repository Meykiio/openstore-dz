import { createIsomorphicFn } from "@tanstack/react-start";
import { getCookie, getRequestHeader, setCookie } from "@tanstack/react-start/server";
import { DEFAULT_LOCALE, isLocale, pickLocale, type Locale } from "./i18n";

const COOKIE = "openstore-locale";

/**
 * The visitor's language, readable on the server and in the browser alike, so
 * both render the same page. Without it the server always rendered Arabic and
 * a French or English visitor watched the page mirror itself after load.
 */
export const readLocale = createIsomorphicFn()
  .server((): Locale => {
    const raw = getCookie(COOKIE);
    if (isLocale(raw)) return raw;
    // First visit: decide from the browser's languages, and remember it in the
    // same response, so the browser reads the cookie the server rendered with.
    const header = getRequestHeader("accept-language") ?? "";
    const locale = pickLocale(header.split(",").map((part) => part.split(";")[0].trim()));
    setCookie(COOKIE, locale, { path: "/", maxAge: 31536000, sameSite: "lax" });
    return locale;
  })
  .client((): Locale => {
    const raw = document.cookie
      .split("; ")
      .find((part) => part.startsWith(`${COOKIE}=`))
      ?.split("=")[1];
    return isLocale(raw) ? raw : DEFAULT_LOCALE;
  });
