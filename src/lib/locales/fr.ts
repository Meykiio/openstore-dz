import type { TranslationKey } from "../i18n";
import { frAdmin } from "./fr.admin";
import { frStorefront } from "./fr.storefront";

/** Mirrors the Arabic keys exactly; a missing key is a compile error. */
export const fr: Record<TranslationKey, string> = { ...frStorefront, ...frAdmin };
