import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { useI18n } from "@/lib/i18n-context";
import { insertVariants, type AdminVariant } from "@/lib/admin-products";
import { buildMatrix, type MatrixColour } from "@/lib/variant-matrix";
import { ColourInput, SizeInput } from "./variant-generator-inputs";

/**
 * Colour × size generator.
 *
 * Adding a polo in 12 colours and 5 sizes used to mean 60 separate forms. Here
 * the owner lists colours, ticks sizes, sets one price and one stock, and sees
 * exactly how many variants will be made before anything is written.
 */
export function VariantGenerator({
  productId,
  productSlug,
  existing,
}: {
  productId: string;
  productSlug: string;
  existing: AdminVariant[];
}) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(existing.length === 0);
  const [colours, setColours] = useState<MatrixColour[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("10");

  const matrix = buildMatrix({
    productSlug,
    colours,
    sizes,
    price: Number(price) || 0,
    stock: Math.max(0, Number(stock) || 0),
    existing,
  });

  const create = useMutation({
    mutationFn: () => insertVariants(productId, matrix.rows),
    onSuccess: () => {
      toast.success(t("admin.gen.done", { count: matrix.rows.length }));
      void queryClient.invalidateQueries({ queryKey: ["admin_product", productId] });
      void queryClient.invalidateQueries({ queryKey: ["admin_products"] });
      setColours([]);
      setSizes([]);
      setOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!open) {
    return (
      <Button variant="secondary" size="sm" className="self-start" onClick={() => setOpen(true)}>
        <Sparkles size={15} aria-hidden="true" />
        {t("admin.gen.open")}
      </Button>
    );
  }

  const ready = matrix.rows.length > 0 && Number(price) > 0;

  return (
    <section className="flex flex-col gap-4 rounded-[16px] border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{t("admin.gen.open")}</h3>
          <p className="mt-1 text-xs text-on-surface-muted">{t("admin.gen.intro")}</p>
        </div>
        <button type="button" onClick={() => setOpen(false)} aria-label={t("common.close")}>
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      <ColourInput colours={colours} onChange={setColours} />
      <SizeInput sizes={sizes} onChange={setSizes} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("admin.gen.price")} required>
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            dir="ltr"
          />
        </Field>
        <Field label={t("admin.gen.stock")}>
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            dir="ltr"
          />
        </Field>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline pt-4">
        <p className="text-sm" aria-live="polite">
          {ready ? (
            <>
              <b>{t("admin.gen.preview", { count: matrix.rows.length })}</b>
              {matrix.skipped > 0 && (
                <span className="text-on-surface-muted">
                  {" "}
                  · {t("admin.gen.skipped", { count: matrix.skipped })}
                </span>
              )}
            </>
          ) : (
            <span className="text-on-surface-muted">{t("admin.gen.nothing")}</span>
          )}
        </p>
        <Button disabled={!ready || create.isPending} onClick={() => create.mutate()}>
          <Sparkles size={15} aria-hidden="true" />
          {t("admin.gen.create")}
        </Button>
      </div>
    </section>
  );
}
