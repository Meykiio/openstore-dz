import { useStoreSettings } from "@/lib/queries";

/**
 * Shop-wide announcement line.
 *
 * Rendered above the header rather than inside it, so it is the first thing on the
 * page and does not push the header's own layout around. It reads from
 * `store_settings`, and shows nothing at all unless the owner has both written
 * something and switched it on: an empty bar is worse than no bar, and a shop that
 * has never opened the settings page must look untouched.
 *
 * Not dismissible. A dismiss control is remembered per visitor, which means state,
 * and an announcement an owner wants seen is usually short-lived enough that the
 * extra machinery is not worth it yet.
 */
export function AnnouncementBar() {
  const { data: settings } = useStoreSettings();
  const text = settings?.announcement?.trim();

  if (!settings?.announcement_enabled || !text) return null;

  return (
    <p className="bg-primary px-4 py-2 text-center text-sm font-medium text-on-primary">{text}</p>
  );
}
