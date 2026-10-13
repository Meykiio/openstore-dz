import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Switch } from "@/components/ui/form";
import { useI18n } from "@/lib/i18n-context";
import { addVariantImage, deleteVariantImage, type AdminVariant } from "@/lib/admin-products";
import { DraftFields, type VariantDraft, toDraft } from "./variant-fields";

/**
 * One variant row: its fields, its active switch, its images, and its own save.
 *
 * Each row saves independently so a failure on one row does not discard edits
 * already made on the others.
 */
export function VariantRow({
  variant,
  busy,
  onSave,
  onDelete,
}: {
  variant: AdminVariant;
  busy: boolean;
  onSave: (draft: VariantDraft, isActive: boolean) => void;
  onDelete: () => void;
}) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<VariantDraft>(() => toDraft(variant));
  const [active, setActive] = useState(variant.is_active);
  const [imageUrl, setImageUrl] = useState("");

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: ["admin_product", variant.product_id] });

  const addImage = useMutation({
    mutationFn: (url: string) => addVariantImage(variant.id, url),
    onSuccess: () => {
      invalidate();
      setImageUrl("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeImage = useMutation({
    mutationFn: (id: string) => deleteVariantImage(id),
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <li className="flex flex-col gap-3 rounded-[16px] border border-outline bg-surface p-4">
      <DraftFields draft={draft} onChange={setDraft} />

      <div className="flex flex-wrap items-center gap-4">
        <Switch
          label={t("common.active")}
          checked={active}
          onChange={(event) => setActive(event.target.checked)}
        />
        <Button size="sm" disabled={busy} onClick={() => onSave(draft, active)}>
          <Save size={15} aria-hidden="true" />
          {t("common.save")}
        </Button>
        <Button variant="ghost" size="sm" disabled={busy} onClick={onDelete} className="text-error">
          <Trash2 size={15} aria-hidden="true" />
          {t("common.delete")}
        </Button>
      </div>

      <div className="flex flex-col gap-2 border-t border-outline pt-3">
        <p className="text-xs font-medium text-on-surface-muted">{t("admin.products.images")}</p>
        <div className="flex flex-wrap items-center gap-2">
          {variant.variant_images.map((image) => (
            <span key={image.id} className="relative">
              <img
                src={image.url}
                alt=""
                className="size-14 rounded-[10px] border border-outline object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage.mutate(image.id)}
                aria-label={t("common.delete")}
                className="absolute -top-1.5 -end-1.5 grid size-5 place-items-center rounded-full bg-error text-white"
              >
                <X size={11} aria-hidden="true" />
              </button>
            </span>
          ))}
          {variant.variant_images.length === 0 && <Badge tone="neutral">{t("common.none")}</Badge>}
        </div>

        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (imageUrl.trim()) addImage.mutate(imageUrl.trim());
          }}
        >
          <Field label="رابط الصورة" className="min-w-56 flex-1">
            <Input
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              dir="ltr"
              type="url"
              placeholder="https://…"
            />
          </Field>
          <Button type="submit" variant="secondary" size="sm" disabled={addImage.isPending}>
            <Plus size={15} aria-hidden="true" />
            {t("common.add")}
          </Button>
        </form>
      </div>
    </li>
  );
}
