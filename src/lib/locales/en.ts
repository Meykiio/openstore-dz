import type { TranslationKey } from "../i18n";
import { enAdmin } from "./en.admin";
import { enStorefront } from "./en.storefront";

/** Mirrors the Arabic keys exactly; a missing key is a compile error. */
export const en: Record<TranslationKey, string> = { ...enStorefront, ...enAdmin };
