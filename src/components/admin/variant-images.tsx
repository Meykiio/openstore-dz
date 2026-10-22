import { useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { useI18n } from "@/lib/i18n-context";
import { uploadProductImage } from "@/lib/image";
import { removeIfUnused } from "@/lib/colour-photos";
import { addVariantImage, deleteVariantImage, type AdminVariant } from "@/lib/admin-products";

/**
 * Upload a batch of files for one variant, returning how many were saved.
 *
 * Sequential rather than parallel: mobile uplinks dislike several large uploads
 * at once, and reporting one failure at a time is clearer than a combined error.
 * Failures are reported per file and do not abort the batch — an owner
 * selecting five photos should not lose four because one was corrupt.
 */
async function uploadBatch(
  files: File[],
  variantId: string,
  productId: string,
): Promise<{ added: number; failures: string[] }> {
  const failures: string[] = [];
  let added = 0;

  for (const file of files) {
    const { url, error } = await uploadProductImage(file, productId);
    if (error || !url) {
      failures.push(`${file.name}: ${error ?? "upload failed"}`);
      continue;
    }
    try {
      await addVariantImage(variantId, url);
      added += 1;
    } catch (error) {
      failures.push(error instanceof Error ? error.message : "could not save");
    }
  }

  return { added, failures };
}

/**
 * Variant image manager.
 *
 * The primary control is a camera button, not a file picker: on a phone
 * `capture="environment"` opens the rear camera directly, which is how an owner
 * actually photographs stock. Opening a file browser to hunt for a photo they
 * have not taken yet is the wrong first step.
 *
 * A URL field is still offered beneath, because an owner importing an existing
 * catalogue has links rather than files.
 */
export function VariantImages({ variant }: { variant: AdminVariant }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState("");

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: ["admin_product", variant.product_id] });

  const addUrl = useMutation({
    mutationFn: (value: string) => addVariantImage(variant.id, value),
    onSuccess: () => {
      invalidate();
      setUrl("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (image: { id: string; url: string }) => {
      await deleteVariantImage(image.id);
      // Remove the stored object too, or every deleted photo leaves bytes behind
      // forever, but only once no other size of this colour still shows it.
      await removeIfUnused(image.url);
    },
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message),
  });

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const { added, failures } = await uploadBatch(
      Array.from(files),
      variant.id,
      variant.product_id,
    );
    setUploading(false);

    for (const failure of failures) toast.error(failure);
    if (added > 0) {
      invalidate();
      toast.success(t("admin.images.addedCount", { count: added }));
    }
  };

  return (
    <div className="flex flex-col gap-3 border-t border-outline pt-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-medium text-on-surface-muted">
          {t("admin.products.images")}
        </span>

        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="sr-only"
          onChange={(event) => {
            void handleFiles(event.target.files);
            event.target.value = "";
          }}
        />

        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={uploading}
          onClick={() => fileInput.current?.click()}
        >
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <Camera size={15} />}
          {uploading ? t("admin.images.uploading") : t("admin.images.add")}
        </Button>
      </div>

      {variant.variant_images.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {variant.variant_images.map((image) => (
            <span key={image.id} className="relative">
              <img
                src={image.url}
                alt=""
                className="size-16 rounded-[10px] border border-outline object-cover"
              />
              <button
                type="button"
                onClick={() => remove.mutate({ id: image.id, url: image.url })}
                aria-label={t("common.delete")}
                className="absolute -top-1.5 -end-1.5 grid size-5 place-items-center rounded-full bg-error text-white"
              >
                <X size={11} aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <Badge tone="neutral">{t("common.none")}</Badge>
      )}

      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (url.trim()) addUrl.mutate(url.trim());
        }}
      >
        <Field label={t("admin.images.pasteUrl")} className="min-w-56 flex-1">
          <Input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            dir="ltr"
            type="url"
            placeholder="https://…"
          />
        </Field>
        <Button type="submit" variant="ghost" size="sm" disabled={addUrl.isPending}>
          <ImagePlus size={15} aria-hidden="true" />
          {t("common.add")}
        </Button>
      </form>
    </div>
  );
}
