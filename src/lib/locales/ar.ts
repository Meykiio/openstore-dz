import { arAdmin } from "./ar.admin";
import { arTools } from "./ar.tools";
import { arStorefront } from "./ar.storefront";

/**
 * Arabic, the reference locale.
 *
 * Its keys define `TranslationKey`, so a key added here and forgotten in `fr` or
 * `en` is a compile error rather than a missing string at runtime.
 *
 * Split into storefront and admin halves because a single file passed the
 * project's 250-line limit. The seam is the audience, which is the real one.
 */
export const ar = { ...arStorefront, ...arAdmin, ...arTools };
