import { Languages } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { LOCALES, LOCALE_LABEL, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Language switcher.
 *
 * A native segmented control rather than a dropdown: there are three options, so
 * showing them all costs less than a tap, and the endonyms are recognisable to
 * someone who cannot read the current language.
 */
export function LocaleSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-outline p-0.5",
        className,
      )}
      role="group"
      aria-label={t("nav.settings")}
    >
      <Languages size={15} className="ms-1.5 text-on-surface-muted" aria-hidden="true" />
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code as Locale)}
          aria-current={locale === code ? "true" : undefined}
          className={cn(
            // min-h-9 keeps each segment a real tap target. At py-1 the buttons
            // measured 25px tall, which is under the 32px floor and awkward for
            // a thumb.
            "inline-flex min-h-9 items-center rounded-full px-3 text-xs font-medium transition-colors duration-150",
            locale === code
              ? "bg-primary text-on-primary"
              : "text-on-surface-muted hover:bg-surface-mid",
          )}
        >
          {LOCALE_LABEL[code as Locale]}
        </button>
      ))}
    </div>
  );
}
