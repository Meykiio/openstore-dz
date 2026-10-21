import { useI18n } from "@/lib/i18n-context";
import type { ColourOption, SizeOption } from "@/lib/variant-options";
import { cn } from "@/lib/utils";

/**
 * Colour, then size. Two short rows instead of one chip per colour × size,
 * which on a real catalogue was over a hundred chips for one polo.
 *
 * An out-of-stock option stays visible and selectable for colour (so the buyer
 * can still see the photos) but is crossed out; an out-of-stock size cannot be
 * picked, because there is nothing to add to the cart.
 */
export function ColourPicker({
  colours,
  selected,
  onSelect,
}: {
  colours: ColourOption[];
  selected: string | null;
  onSelect: (name: string) => void;
}) {
  const { t } = useI18n();
  if (colours.length === 0) return null;

  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="mb-1 text-sm">
        <span className="text-on-surface-muted">{t("store.color")}: </span>
        <span className="font-semibold">{selected}</span>
      </legend>
      <div className="flex flex-wrap gap-2.5">
        {colours.map((colour) => (
          <button
            key={colour.name}
            type="button"
            onClick={() => onSelect(colour.name)}
            aria-pressed={colour.name === selected}
            aria-label={colour.name}
            title={colour.name}
            className={cn("swatch", colour.name === selected && "active", !colour.inStock && "out")}
          >
            <span style={{ background: colour.hex ?? "var(--surface-high)" }} />
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function SizePicker({
  sizes,
  selected,
  onSelect,
}: {
  sizes: SizeOption[];
  selected: string | null;
  onSelect: (name: string) => void;
}) {
  const { t } = useI18n();
  if (sizes.length === 0) return null;

  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="mb-1 text-sm">
        <span className="text-on-surface-muted">{t("store.size")}: </span>
        <span className="font-semibold">{selected}</span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => (
          <button
            key={size.name}
            type="button"
            onClick={() => onSelect(size.name)}
            disabled={!size.inStock}
            aria-pressed={size.name === selected}
            className={cn("size-chip", size.name === selected && "active")}
          >
            {size.name}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
