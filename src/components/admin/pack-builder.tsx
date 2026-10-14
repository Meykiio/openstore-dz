import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n-context";
import type { PickerVariant } from "@/lib/product-picker";
import { fetchPackItems, removePackItem, upsertPackItem, type PackItem } from "@/lib/admin-content";

/** "M / أبيض", matching how the storefront labels a variant. */
function label(variant: PickerVariant | undefined): string {
  if (!variant) return "—";
  const parts = [variant.size, variant.color_name].filter(Boolean);
  return parts.length > 0 ? parts.join(" / ") : variant.id.slice(0, 8);
}

/**
 * Pack contents editor.
 *
 * A pack is a product whose price is set on its own variants, and whose contents
 * are a list of references to other products' variants. The contents are
 * informational for the buyer and used later to work out what to ship; the price
 * is not derived from them, so a seller can discount a bundle freely.
 */
export function PackBuilder({
  productId,
  variants,
}: {
  productId: string;
  /** Every variant in the catalogue, so a pack can reference other products. */
  variants: PickerVariant[];
}) {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const { data: items } = useQuery({
    queryKey: ["pack_items", productId],
    queryFn: () => fetchPackItems(productId),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["pack_items", productId] });
    void queryClient.invalidateQueries({ queryKey: ["admin_product", productId] });
    void queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const save = useMutation({
    mutationFn: (input: { variant_id: string; quantity: number }) =>
      upsertPackItem({ product_id: productId, ...input, sort_order: items?.length ?? 0 }),
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => removePackItem(id),
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message),
  });

  const byId = new Map(variants.map((v) => [v.id, v]));
  const listed = items ?? [];

  return (
    <div className="flex flex-col gap-4">
      {listed.length === 0 ? (
        <p className="text-sm text-on-surface-muted">
          لم تُضف أي مكوّنات بعد. أضف المنتجات التي يتضمنها هذا الباك.
        </p>
      ) : (
        <ul className="divide-y divide-outline rounded-[16px] border border-outline">
          {listed.map((item: PackItem) => {
            const variant = byId.get(item.variant_id);
            return (
              <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="min-w-0">
                  <span className="block truncate text-sm">{label(variant)}</span>
                  <span className="font-mono text-xs text-on-surface-muted" dir="ltr">
                    {variant?.sku ?? item.variant_id.slice(0, 8)}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <Badge tone="primary">×{item.quantity}</Badge>
                  <button
                    type="button"
                    onClick={() => remove.mutate(item.id)}
                    aria-label={t("common.delete")}
                    className="text-on-surface-muted hover:text-error"
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <AddPackItem
        variants={variants}
        onAdd={(input) => save.mutate(input)}
        busy={save.isPending}
      />
    </div>
  );
}

function AddPackItem({
  variants,
  onAdd,
  busy,
}: {
  variants: PickerVariant[];
  onAdd: (input: { variant_id: string; quantity: number }) => void;
  busy: boolean;
}) {
  const { t } = useI18n();
  const [variantId, setVariantId] = useState("");
  const [quantity, setQuantity] = useState("1");

  return (
    <div className="grid gap-3 sm:grid-cols-[3fr_1fr_auto] sm:items-end">
      <Field label={t("admin.products.packContents")}>
        <Select value={variantId} onChange={(event) => setVariantId(event.target.value)}>
          <option value="">{t("common.add")}…</option>
          {variants.map((variant) => (
            <option key={variant.id} value={variant.id}>
              {label(variant)} — {variant.sku ?? variant.id.slice(0, 6)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t("common.quantity")}>
        <Input
          type="number"
          min={1}
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          dir="ltr"
          className="font-mono"
        />
      </Field>
      <Button
        type="button"
        variant="secondary"
        disabled={!variantId || busy}
        onClick={() => {
          onAdd({ variant_id: variantId, quantity: Number(quantity) || 1 });
          setVariantId("");
          setQuantity("1");
        }}
      >
        {t("common.add")}
      </Button>
    </div>
  );
}
