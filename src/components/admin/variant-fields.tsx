import { Field, Input } from "@/components/ui/form";
import { useI18n } from "@/lib/i18n-context";
import type { AdminVariant } from "@/lib/admin-products";

/**
 * The editable fields of a variant.
 *
 * Price and stock are held as strings and parsed on save, so a half-typed "12"
 * is not committed as `12` while the user is still heading for "1200".
 */
export type VariantDraft = {
  size: string;
  color_name: string;
  color_hex: string;
  sku: string;
  price: string;
  stock: string;
  weight_grams: string;
};

export const EMPTY_DRAFT: VariantDraft = {
  size: "",
  color_name: "",
  color_hex: "",
  sku: "",
  price: "",
  stock: "0",
  weight_grams: "",
};

export function toDraft(variant: AdminVariant): VariantDraft {
  return {
    size: variant.size ?? "",
    color_name: variant.color_name ?? "",
    color_hex: variant.color_hex ?? "",
    sku: variant.sku ?? "",
    price: String(variant.price),
    stock: String(variant.stock),
    weight_grams: variant.weight_grams === null ? "" : String(variant.weight_grams),
  };
}

export function DraftFields({
  draft,
  onChange,
}: {
  draft: VariantDraft;
  onChange: (next: VariantDraft) => void;
}) {
  const { t } = useI18n();
  const set = <K extends keyof VariantDraft>(key: K, value: VariantDraft[K]) =>
    onChange({ ...draft, [key]: value });

  return (
    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <Field label={t("store.size")}>
        <Input value={draft.size} onChange={(e) => set("size", e.target.value)} maxLength={20} />
      </Field>
      <Field label={t("store.color")}>
        <Input
          value={draft.color_name}
          onChange={(e) => set("color_name", e.target.value)}
          maxLength={40}
        />
      </Field>
      <Field label={t("common.price")} required>
        <Input
          type="number"
          min={0}
          value={draft.price}
          onChange={(e) => set("price", e.target.value)}
          dir="ltr"
          className="font-mono"
        />
      </Field>
      <Field label={t("common.quantity")}>
        <Input
          type="number"
          min={0}
          value={draft.stock}
          onChange={(e) => set("stock", e.target.value)}
          dir="ltr"
          className="font-mono"
        />
      </Field>
      <Field label="الوزن (غ)">
        <Input
          type="number"
          min={0}
          value={draft.weight_grams}
          onChange={(e) => set("weight_grams", e.target.value)}
          dir="ltr"
          className="font-mono"
        />
      </Field>
      <Field label="SKU">
        <Input
          value={draft.sku}
          onChange={(e) => set("sku", e.target.value)}
          dir="ltr"
          className="font-mono"
          maxLength={40}
        />
      </Field>
    </div>
  );
}
