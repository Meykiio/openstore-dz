import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { VariantEditor } from "@/components/admin/variant-editor";
import { VariantGenerator } from "@/components/admin/variant-generator";
import { ColourPhotos } from "@/components/admin/colour-photos";
import { ProductFieldsCard, type ProductDraft } from "@/components/admin/product-fields";
import { PackBuilder } from "@/components/admin/pack-builder";
import { SizeGuideEditor } from "@/components/admin/size-guide-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, LoadingState } from "@/components/ui/feedback";
import { useI18n } from "@/lib/i18n-context";
import { updateProduct, useAdminProduct } from "@/lib/admin-products";
import { useProductPicker } from "@/lib/product-picker";

export const Route = createFileRoute("/admin/product/$id")({
  component: ProductEditPage,
});

type Patch = Parameters<typeof updateProduct>[1];

function ProductEditPage() {
  const { id } = Route.useParams();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { data: product, isPending } = useAdminProduct(id);
  // Variants for the pack contents picker. A narrow query, not the admin list.
  const { data: allProducts } = useProductPicker();
  const allVariants = (allProducts ?? []).flatMap((p) => p.product_variants);

  const [draft, setDraft] = useState<ProductDraft | null>(null);

  // Seed once the product arrives; never overwrite in-flight edits.
  useEffect(() => {
    if (product && !draft) {
      setDraft({
        name: product.name,
        name_fr: product.name_fr ?? "",
        description: product.description ?? "",
        description_fr: product.description_fr ?? "",
        category_id: product.category_id ?? "",
      });
    }
  }, [product, draft]);

  const invalidate = () => {
    for (const key of [
      ["admin_product", id],
      ["admin_products"],
      ["product", product?.slug],
      ["products"],
    ]) {
      void queryClient.invalidateQueries({ queryKey: key });
    }
  };

  const save = useMutation({
    mutationFn: (patch: Patch) => updateProduct(id, patch),
    onSuccess: () => {
      invalidate();
      toast.success(t("common.save"));
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isPending) return <LoadingState />;
  if (!product) return <EmptyState title={t("order.notFound")} />;
  if (!draft) return <LoadingState />;

  const set = <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) =>
    setDraft({ ...draft, [key]: value });

  const publishable = product.product_variants.length > 0;
  const published = product.status === "published";

  const togglePublish = () =>
    save.mutate({
      status: published ? "draft" : "published",
      ...(published || product.published_at ? {} : { published_at: new Date().toISOString() }),
    });

  const saveFields = () =>
    save.mutate({
      name: draft.name.trim(),
      name_fr: draft.name_fr.trim() || null,
      description: draft.description.trim() || null,
      description_fr: draft.description_fr.trim() || null,
      category_id: draft.category_id.trim() || null,
    });

  return (
    <div className="flex flex-col gap-6">
      <ProductHeader
        name={product.name}
        slug={product.slug}
        published={published}
        publishable={publishable}
        busy={save.isPending}
        onTogglePublish={togglePublish}
        onSaveFields={saveFields}
      />

      {!publishable && (
        <p className="rounded-[10px] border border-tertiary/40 bg-tertiary/5 px-4 py-3 text-sm">
          {t("admin.products.noVariants")}
        </p>
      )}

      <ProductFieldsCard
        draft={draft}
        set={set}
        status={product.status}
        onStatusChange={(status) => save.mutate({ status })}
      />

      {product.product_variants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.photos.title")}</CardTitle>
          </CardHeader>
          <CardBody>
            <ColourPhotos productId={id} variants={product.product_variants} />
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.products.variants")}</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          <VariantGenerator
            productId={id}
            productSlug={product.slug}
            existing={product.product_variants}
          />
          <VariantEditor productId={id} variants={product.product_variants} />
        </CardBody>
      </Card>

      {product.kind === "pack" && (
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.products.packContents")}</CardTitle>
          </CardHeader>
          <CardBody>
            {/* A pack references variants from anywhere in the catalogue, so the
                picker is given every variant, not just this product's. */}
            <PackBuilder productId={id} variants={allVariants} />
          </CardBody>
        </Card>
      )}

      <SizeGuideEditor productId={id} />
    </div>
  );
}

function ProductHeader({
  name,
  slug,
  published,
  publishable,
  busy,
  onTogglePublish,
  onSaveFields,
}: {
  name: string;
  slug: string;
  published: boolean;
  publishable: boolean;
  busy: boolean;
  onTogglePublish: () => void;
  onSaveFields: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Link
          to="/admin/products"
          className="btn btn-ghost btn-icon !rounded-full !border !border-outline"
          aria-label={t("common.back")}
        >
          <ArrowLeft size={16} className="rtl:rotate-180" aria-hidden="true" />
        </Link>
        <div>
          <h1 className="font-display text-xl font-semibold">{name}</h1>
          <p className="font-mono text-xs text-on-surface-muted" dir="ltr">
            /product/{slug}
          </p>
        </div>
        <Badge tone={published ? "positive" : "neutral"}>
          {published ? t("common.published") : t("common.draft")}
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          disabled={!publishable || busy}
          title={publishable ? undefined : t("admin.products.noVariants")}
          onClick={onTogglePublish}
        >
          {published ? t("admin.products.unpublish") : t("admin.products.publish")}
        </Button>
        <Button disabled={busy} onClick={onSaveFields}>
          <Save size={16} aria-hidden="true" />
          {busy ? t("common.saving") : t("common.save")}
        </Button>
      </div>
    </div>
  );
}
