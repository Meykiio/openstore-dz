import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";

const FOCUS = [
  { value: 0, label: "admin.frame.top" },
  { value: 0.5, label: "admin.frame.center" },
  { value: 1, label: "admin.frame.bottom" },
] as const;

/**
 * Which part of a tall photo an upload keeps when it is cut to the shop's frame:
 * top for a hoodie on a model, bottom for pants, centre for a flat lay.
 */
export function FramePicker({
  value,
  onChange,
  disabled = false,
}: {
  value: number;
  onChange: (focus: number) => void;
  /** While a batch uploads: it keeps the choice it started with. */
  disabled?: boolean;
}) {
  const { t } = useI18n();
  return (
    <div
      role="group"
      aria-label={t("admin.frame.keep")}
      className="flex flex-wrap items-center gap-1.5 text-xs"
    >
      <span className="text-on-surface-muted">{t("admin.frame.keep")}</span>
      {FOCUS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={cn(
            "min-h-8 rounded-full border px-3 disabled:opacity-50",
            value === option.value
              ? "border-on-surface bg-on-surface text-surface"
              : "border-outline text-on-surface",
          )}
        >
          {t(option.label)}
        </button>
      ))}
    </div>
  );
}
