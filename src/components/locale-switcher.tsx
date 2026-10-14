import { Select } from "@/components/ui/form";
import { useI18n } from "@/lib/i18n-context";
import { LOCALES, LOCALE_LABEL, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Language switcher.
 *
 * A native `<select>`, not a custom menu. There are three options and one
 * control, and the platform's own picker beats anything that could be hand-built
 * here: on a phone it opens the OS wheel, and on a desktop it gets keyboard,
 * type-ahead and screen-reader support for free. A custom popover would be more
 * code and worse at all of that.
 *
 * The options are endonyms, so someone who cannot read the current language can
 * still find their own.
 */
export function LocaleSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <Select
      value={locale}
      onChange={(event) => setLocale(event.target.value as Locale)}
      aria-label={t("nav.language")}
      title={t("nav.language")}
      className={cn("form-select-compact", className)}
    >
      {LOCALES.map((code) => (
        <option key={code} value={code}>
          {LOCALE_LABEL[code]}
        </option>
      ))}
    </Select>
  );
}
