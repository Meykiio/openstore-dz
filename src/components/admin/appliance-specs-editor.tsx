import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/form";
import { useI18n } from "@/lib/i18n-context";
import { getSupabase } from "@/lib/supabase/client";
import { uploadProductImage } from "@/lib/image";

/**
 * Appliance specifications schema.
 * Dimensions are stored as a single string "W x H x D".
 */
export type ApplianceSpecs = {
  brand?: string | null;
  model?: string | null;
  capacity?: string | null;
  power?: string | null;
  dimensions?: string | null;
  weight?: string | null;
  warranty?: string | null;
  specs?: string | null;
  color?: string | null;
};

type UploadOutcome = { url: string | null; error: string | null };

/**
 * Upload a GLB file and return its public URL, or null on failure.
 * GLB files are stored in the same product-media bucket; existing storage
 * policies already gate writes to authenticated admins.
 */
async function uploadGlb(productId: string, file: File): Promise<UploadOutcome> {
  if (!file.name.toLowerCase().endsWith(".glb")) {
    return { url: null, error: "Only .glb files are accepted for 3D models." };
  }
  const path = `products/${productId}/model-${Date.now()}.glb`;
  const { error } = await getSupabase()
    .storage.from("product-media")
    .upload(path, file, { contentType: "model/gltf-binary" });
  if (error) return { url: null, error: error.message };
  const { data } = getSupabase().storage.from("product-media").getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

/**
 * Save appliance specs for a product.
 */
async function saveApplianceSpecs(input: {
  product_id: string;
  model_url: string | null;
  specs: ApplianceSpecs;
}): Promise<void> {
  const db = getSupabase();
  const result = await db.from("products").update({
    model_url: input.model_url,
    appliance_specs: input.specs,
  } as unknown as { model_url: string | null; appliance_specs: Record<string, unknown> });
  const { error } = result;
  if (error) throw new Error(error.message);
}

const DEFAULT_SPECS: ApplianceSpecs = {
  brand: "",
  model: "",
  capacity: "",
  power: "",
  dimensions: "",
  weight: "",
  warranty: "",
  specs: "",
  color: "",
};

/**
 * Editor for appliance specifications on a single product.
 *
 * Replaces the old SizeGuideEditor on the product edit page. Shop owners can
 * upload a GLB 3D model, add a primary product image, and fill in specification
 * fields. If no model is uploaded, the storefront shows only the image.
 */
export function ApplianceSpecsEditor({ productId }: { productId: string }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);

  // Fetch current product to extract specs and model_url.
  const { data: product, isPending } = useQuery({
    queryKey: ["admin_product", productId],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from("products")
        .select("model_url, appliance_specs")
        .eq("id", productId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as { model_url: string | null; appliance_specs: Record<string, unknown> | null } | null;
    },
  });

  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [primaryImageUrl, setPrimaryImageUrl] = useState<string | null>(null);
  const [specs, setSpecs] = useState<ApplianceSpecs>(DEFAULT_SPECS);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!product) return;
    setModelUrl(product.model_url ?? null);
    setSpecs(
      product.appliance_specs && typeof product.appliance_specs === "object"
        ? (product.appliance_specs as ApplianceSpecs)
        : DEFAULT_SPECS,
    );
  }, [product]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin_product", productId] });
    void queryClient.invalidateQueries({ queryKey: ["product", productId] });
    void queryClient.invalidateQueries({ queryKey: ["admin_products"] });
  };

  const save = useMutation({
    mutationFn: () =>
      saveApplianceSpecs({
        product_id: productId,
        model_url: modelUrl,
        specs,
      }),
    onSuccess: () => {
      invalidate();
      toast.success(t("common.save"));
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const uploadModel = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    const outcome = await uploadGlb(productId, file);
    setBusy(false);
    if (outcome.error || !outcome.url) {
      toast.error(outcome.error ?? t("common.somethingWrong"));
      return;
    }
    setModelUrl(outcome.url);
  };

  const uploadImage = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    const outcome = await uploadProductImage(file, productId);
    setBusy(false);
    if (outcome.error || !outcome.url) {
      toast.error(outcome.error ?? t("common.somethingWrong"));
      return;
    }
    setPrimaryImageUrl(outcome.url);
  };

  const setField = <K extends keyof ApplianceSpecs>(key: K, value: ApplianceSpecs[K]) =>
    setSpecs((prev) => ({ ...prev, [key]: value }));

  const removeModel = () => setModelUrl(null);
  const removeImage = () => setPrimaryImageUrl(null);

  if (isPending) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 size={16} className="text-primary" aria-hidden="true" />
          {t("store.applianceSpecs")}
        </CardTitle>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        {/* 3D model upload */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.03em] text-on-surface-muted">
            {t("admin.applianceSpecs.model3d")}
          </span>
          <div className="flex flex-wrap items-center gap-3">
            {modelUrl ? (
              <div className="flex items-center gap-2">
                <span className="rounded-[10px] border border-outline px-3 py-2 text-xs font-mono text-on-surface-muted max-w-xs truncate">
                  {modelUrl}
                </span>
                <button
                  type="button"
                  onClick={removeModel}
                  disabled={busy}
                  aria-label={t("common.delete")}
                  className="grid size-7 place-items-center rounded-full bg-error text-white hover:bg-error/80"
                >
                  <Trash2 size={13} aria-hidden="true" />
                </button>
              </div>
            ) : null}
            <input
              ref={fileInput}
              type="file"
              accept=".glb"
              className="hidden"
              onChange={(event) => {
                void uploadModel(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => fileInput.current?.click()}
            >
              {busy ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Camera size={15} />
              )}
              {t("admin.applianceSpecs.uploadModel")}
            </Button>
          </div>
          <p className="text-xs text-on-surface-muted">{t("admin.applianceSpecs.modelHint")}</p>
        </div>

        {/* Primary product image */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.03em] text-on-surface-muted">
            {t("admin.applianceSpecs.primaryImage")}
          </span>
          <div className="flex flex-wrap items-center gap-3">
            {primaryImageUrl ? (
              <div className="flex items-center gap-2">
                <img
                  src={primaryImageUrl}
                  alt=""
                  className="size-16 rounded-[10px] border border-outline object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  disabled={busy}
                  aria-label={t("common.delete")}
                  className="grid size-7 place-items-center rounded-full bg-error text-white hover:bg-error/80"
                >
                  <Trash2 size={13} aria-hidden="true" />
                </button>
              </div>
            ) : null}
            <input
              ref={imageInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                void uploadImage(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => imageInput.current?.click()}
            >
              {busy ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Camera size={15} />
              )}
              {t("admin.images.add")}
            </Button>
          </div>
        </div>

        {/* Dimensions */}
        <Field label={t("admin.applianceSpecs.dimensions")}>
          <Input
            value={specs.dimensions ?? ""}
            onChange={(e) => setField("dimensions", e.target.value)}
            placeholder={t("admin.applianceSpecs.widthPlaceholder")}
            maxLength={60}
          />
        </Field>

        {/* Other spec fields */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("admin.applianceSpecs.brand")}>
            <Input
              value={specs.brand ?? ""}
              onChange={(e) => setField("brand", e.target.value)}
              maxLength={80}
            />
          </Field>
          <Field label={t("admin.applianceSpecs.model")}>
            <Input
              value={specs.model ?? ""}
              onChange={(e) => setField("model", e.target.value)}
              maxLength={80}
            />
          </Field>
          <Field label={t("admin.applianceSpecs.capacity")}>
            <Input
              value={specs.capacity ?? ""}
              onChange={(e) => setField("capacity", e.target.value)}
              maxLength={40}
            />
          </Field>
          <Field label={t("admin.applianceSpecs.power")}>
            <Input
              value={specs.power ?? ""}
              onChange={(e) => setField("power", e.target.value)}
              maxLength={40}
            />
          </Field>
          <Field label={t("admin.applianceSpecs.weight")}>
            <Input
              value={specs.weight ?? ""}
              onChange={(e) => setField("weight", e.target.value)}
              maxLength={40}
            />
          </Field>
          <Field label={t("admin.applianceSpecs.warranty")}>
            <Input
              value={specs.warranty ?? ""}
              onChange={(e) => setField("warranty", e.target.value)}
              maxLength={80}
            />
          </Field>
          <Field label={t("admin.applianceSpecs.color")} className="sm:col-span-2">
            <Input
              value={specs.color ?? ""}
              onChange={(e) => setField("color", e.target.value)}
              maxLength={40}
            />
          </Field>
          <Field
            label={t("admin.applianceSpecs.specs")}
            hint={t("admin.applianceSpecs.specsHint")}
            className="sm:col-span-2"
          >
            <Textarea
              value={specs.specs ?? ""}
              onChange={(e) => setField("specs", e.target.value)}
              rows={3}
              maxLength={2000}
            />
          </Field>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            disabled={save.isPending}
            onClick={() => save.mutate()}
          >
            <Camera size={16} aria-hidden="true" />
            {save.isPending ? t("common.saving") : t("common.save")}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
