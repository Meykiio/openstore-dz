import type { TranslationKey } from "../i18n";
import { frAdmin } from "./fr.admin";
import { frTools } from "./fr.tools";
import { frStorefront } from "./fr.storefront";
import { frShop } from "./fr.shop";
import { frAi } from "./fr.ai";
import { frTelegram } from "./fr.telegram";
import { frAccount } from "./fr.account";

/** Mirrors the Arabic keys exactly; a missing key is a compile error. */
export const fr: Record<TranslationKey, string> = {
  ...frStorefront,
  ...frShop,
  ...frAdmin,
  ...frTools,
  ...frAi,
  ...frTelegram,
  ...frAccount,
};
