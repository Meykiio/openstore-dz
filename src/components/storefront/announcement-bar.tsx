import { useI18n } from "@/lib/i18n-context";
import { useStoreSettings } from "@/lib/queries";

/**
 * Shop-wide top line.
 *
 * When the owner has written and enabled an announcement, that is what shows.
 * Otherwise the bar carries a service line built from real settings rather than
 * disappearing: a premium storefront opens with its terms, and cash on delivery
 * across the wilayas is the offer this shop actually keeps.
 */
export function AnnouncementBar() {
  const { t } = useI18n();
  const { data: settings } = useStoreSettings();
  const custom = settings?.announcement?.trim();
  const text =
    settings?.announcement_enabled && custom
      ? custom
      : t("announcement.default", { days: settings?.returns_days ?? 14 });

  return (
    <p className="store-announce">
      <span className="dot" aria-hidden="true" />
      <span>{text}</span>
    </p>
  );
}
