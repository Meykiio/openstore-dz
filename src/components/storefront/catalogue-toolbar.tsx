import { useState } from "react";
import { Check, SlidersHorizontal, X } from "lucide-react";
import { Field, Input, Select } from "@/components/ui/form";
import { useI18n } from "@/lib/i18n-context";
import { formatDzd } from "@/lib/format";
import { activeFilterCount, type CatalogueFilters, type SortKey } from "@/lib/catalogue";
import { cn } from "@/lib/utils";

type Facets = {
  sizes: string[];
  colors: string[];
  priceMin: number;
  priceMax: number;
};

/**
 * Catalogue filter and sort bar.
 *
 * Collapsed behind a button on every screen size: a row of chips permanently
 * occupying the top of the page pushes the photography down. The count on the
 * button is what tells a buyer filters are active.
 */
export function CatalogueToolbar({
  filters,
  onChange,
  sizes,
  colors,
  priceMin,
  priceMax,
}: {
  filters: CatalogueFilters;
  onChange: (next: CatalogueFilters) => void;
} & Facets) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const active = activeFilterCount(filters);

  return (
    <div className="flex flex-col gap-3">
      <div className="catalogue-toolbar">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className={cn(
            "store-btn store-btn--sm",
            active > 0 ? "store-btn--fill" : "store-btn--ghost",
          )}
        >
          <SlidersHorizontal size={14} aria-hidden="true" />
          {t("catalogue.filters")}
          {active > 0 && (
            <span className="grid size-5 place-items-center rounded-full bg-[var(--store-accent)] text-[10px] font-semibold text-[var(--store-accent-ink)]">
              {active}
            </span>
          )}
        </button>

        <span className="ms-auto flex items-center gap-2">
          <label
            htmlFor="catalogue-sort"
            className="shrink-0 whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.14em] text-on-surface-muted"
          >
            {t("catalogue.sort")}
          </label>
          <Select
            id="catalogue-sort"
            value={filters.sort}
            onChange={(event) => onChange({ ...filters, sort: event.target.value as SortKey })}
            className="h-10 w-auto min-w-40 py-0"
          >
            <option value="newest">{t("catalogue.sortNewest")}</option>
            <option value="price-asc">{t("catalogue.sortPriceAsc")}</option>
            <option value="price-desc">{t("catalogue.sortPriceDesc")}</option>
            <option value="name">{t("catalogue.sortName")}</option>
          </Select>
        </span>
      </div>

      {open && (
        <FilterPanel
          filters={filters}
          onChange={onChange}
          sizes={sizes}
          colors={colors}
          priceMin={priceMin}
          priceMax={priceMax}
        />
      )}
    </div>
  );
}

function FilterPanel({
  filters,
  onChange,
  sizes,
  colors,
  priceMin,
  priceMax,
}: {
  filters: CatalogueFilters;
  onChange: (next: CatalogueFilters) => void;
} & Facets) {
  const { t } = useI18n();
  const active = activeFilterCount(filters);

  const set = <K extends keyof CatalogueFilters>(key: K, value: CatalogueFilters[K]) =>
    onChange({ ...filters, [key]: value });

  const toggleIn = (key: "sizes" | "colors", value: string) => {
    const current = filters[key];
    set(
      key,
      current.includes(value) ? current.filter((entry) => entry !== value) : [...current, value],
    );
  };

  return (
    <div className="store-panel grid gap-6 p-5 sm:grid-cols-2">
      {sizes.length > 0 && (
        <FilterGroup
          label={t("catalogue.size")}
          values={sizes}
          selected={filters.sizes}
          onToggle={(value) => toggleIn("sizes", value)}
        />
      )}

      {colors.length > 0 && (
        <FilterGroup
          label={t("catalogue.color")}
          values={colors}
          selected={filters.colors}
          onToggle={(value) => toggleIn("colors", value)}
        />
      )}

      <div className="flex flex-col gap-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-on-surface-muted">
          {t("catalogue.price")}
        </span>
        <div className="flex flex-wrap items-end gap-3">
          <Field label={t("catalogue.priceFrom")} className="w-32">
            <Input
              type="number"
              inputMode="numeric"
              dir="ltr"
              className="font-mono"
              placeholder={String(priceMin)}
              value={filters.minPrice ?? ""}
              onChange={(event) =>
                set("minPrice", event.target.value === "" ? null : Number(event.target.value))
              }
            />
          </Field>
          <Field label={t("catalogue.priceTo")} className="w-32">
            <Input
              type="number"
              inputMode="numeric"
              dir="ltr"
              className="font-mono"
              placeholder={String(priceMax)}
              value={filters.maxPrice ?? ""}
              onChange={(event) =>
                set("maxPrice", event.target.value === "" ? null : Number(event.target.value))
              }
            />
          </Field>
          <p className="pb-2 font-mono text-xs text-on-surface-muted" dir="ltr">
            {formatDzd(priceMin)} - {formatDzd(priceMax)}
          </p>
        </div>
      </div>

      <div className="flex flex-col justify-between gap-4">
        <label className="flex min-h-11 items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            className="size-4 accent-[color:var(--store-accent)]"
            checked={filters.inStockOnly}
            onChange={(event) => set("inStockOnly", event.target.checked)}
          />
          {t("catalogue.inStockOnly")}
        </label>

        {active > 0 && (
          <button
            type="button"
            onClick={() =>
              onChange({
                ...filters,
                sizes: [],
                colors: [],
                minPrice: null,
                maxPrice: null,
                inStockOnly: false,
              })
            }
            className="store-btn store-btn--ghost store-btn--sm self-start"
          >
            <X size={14} aria-hidden="true" />
            {t("catalogue.clearAll")}
          </button>
        )}
      </div>
    </div>
  );
}

function FilterGroup({
  label,
  values,
  selected,
  onToggle,
}: {
  label: string;
  values: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="font-mono text-[9px] uppercase tracking-[0.14em] text-on-surface-muted">
        {label}
      </legend>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => {
          const isOn = selected.includes(value);
          return (
            <button
              key={value}
              type="button"
              onClick={() => onToggle(value)}
              aria-pressed={isOn}
              className={cn("store-chip", isOn && "store-chip--on")}
              data-active={isOn || undefined}
            >
              {isOn && <Check size={13} aria-hidden="true" />}
              {value}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
