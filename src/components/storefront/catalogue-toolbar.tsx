import { useState } from "react";
import { Check, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
 * Collapsed behind a button on every screen size, including desktop. A row of
 * chips permanently occupying the top of the page pushes the products down,
 * which fights the design thesis that the photography leads. The count on the
 * button is what tells a buyer filters are active.
 */
export function CatalogueToolbar({
  filters,
  onChange,
  sizes,
  colors,
  priceMin,
  priceMax,
  resultCount,
}: {
  filters: CatalogueFilters;
  onChange: (next: CatalogueFilters) => void;
  resultCount: number;
} & Facets) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const active = activeFilterCount(filters);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
        >
          <SlidersHorizontal size={15} aria-hidden="true" />
          {t("catalogue.filters")}
          {active > 0 && (
            <span className="grid size-5 place-items-center rounded-full bg-primary text-[10px] font-semibold text-on-primary">
              {active}
            </span>
          )}
        </Button>

        <span className="font-mono text-xs text-on-surface-muted">
          {resultCount} {t("catalogue.results")}
        </span>

        <span className="ms-auto flex items-center gap-2">
          <label htmlFor="catalogue-sort" className="text-xs text-on-surface-muted">
            {t("catalogue.sort")}
          </label>
          <Select
            id="catalogue-sort"
            value={filters.sort}
            onChange={(event) => onChange({ ...filters, sort: event.target.value as SortKey })}
            className="h-9 w-auto py-0"
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
    set(key, current.includes(value) ? current.filter((e) => e !== value) : [...current, value]);
  };

  return (
    <div className="flex flex-col gap-5 rounded-[16px] border border-outline bg-surface p-5">
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
        <span className="text-xs font-semibold uppercase tracking-[0.03em] text-on-surface-muted">
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

      <label className="flex items-center gap-2.5 text-sm">
        <input
          type="checkbox"
          className="size-4 accent-[color:var(--primary-solid)]"
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
          className="self-start text-sm font-medium text-primary hover:underline"
        >
          {t("catalogue.clearAll")}
        </button>
      )}
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
      <legend className="text-xs font-semibold uppercase tracking-[0.03em] text-on-surface-muted">
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
              className={cn("chip", isOn && "filled")}
            >
              {isOn ? (
                <Check size={13} aria-hidden="true" />
              ) : (
                <X size={13} className="opacity-0" aria-hidden="true" />
              )}
              {value}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
