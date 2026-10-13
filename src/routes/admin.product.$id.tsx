import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { VariantEditor } from "@/components/admin/variant-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { EmptyState, LoadingState } from "@/components/ui/feedback";
import { useI18n } from "@/lib/i18n-context";
import { updateProduct, useAdminProduct, type AdminProduct } from "@/lib/admin-products";

export const Route = createFileRoute("/admin/product/$id")({
  component: ProductEditPage,
});

type Draft = {
  name: string;
  name_fr: string;
  description: string;
  description_fr: string;
  category: string;
};

type Patch = Parameters<typeof updateProduct>[1];

function ProductEditPage() {
  const { id } = Route.useParams();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { data: product, isPending } = useAdminProduct(id);

  const [draft, setDraft] = useState<Draft | null>(null);

  // Seed once the product arrives; never overwrite in-flight edits.
  useEffect(() => {
    if (product && !draft) {
      setDraft({
        name: product.name,
        name_fr: product.name_fr ?? "",
        description: product.description ?? "",
        description_fr: product.description_fr ?? "",
        category: product.category ?? "",
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

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
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
      category: draft.category.trim() || null,
    });

  return (
    <div className="flex flex-col gap-6">
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
            <h1 className="font-display text-xl font-semibold">{product.name}</h1>
            <p className="font-mono text-xs text-on-surface-muted" dir="ltr">
              /product/{product.slug}
            </p>
          </div>
          <Badge tone={published ? "positive" : "neutral"}>
            {published ? t("common.published") : t("common.draft")}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            disabled={!publishable || save.isPending}
            title={publishable ? undefined : t("admin.products.noVariants")}
            onClick={togglePublish}
          >
            {published ? t("admin.products.unpublish") : t("admin.products.publish")}
          </Button>
          <Button disabled={save.isPending} onClick={saveFields}>
            <Save size={16} aria-hidden="true" />
            {save.isPending ? t("common.saving") : t("common.save")}
          </Button>
        </div>
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.products.variants")}</CardTitle>
        </CardHeader>
        <CardBody>
          <VariantEditor productId={id} variants={product.product_variants} />
        </CardBody>
      </Card>
    </div>
  );
}

function ProductFieldsCard({
  draft,
  set,
  status,
  onStatusChange,
}: {
  draft: Draft;
  set: <K extends keyof Draft>(key: K, value: Draft[K]) => void;
  status: string;
  onStatusChange: (status: AdminProduct["status"]) => void;
}) {
  const { t } = useI18n();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("common.description")}</CardTitle>
      </CardHeader>
      <CardBody className="grid gap-4 sm:grid-cols-2">
        <Field label={t("common.name")} required>
          <Input value={draft.name} onChange={(e) => set("name", e.target.value)} maxLength={120} />
        </Field>
        <Field label="الاسم بالفرنسية">
          <Input
            value={draft.name_fr}
            onChange={(e) => set("name_fr", e.target.value)}
            maxLength={120}
            dir="ltr"
          />
        </Field>
        <Field label={t("common.description")}>
          <Textarea
            value={draft.description}
            onChange={(e) => set("description", e.target.value)}
            rows={4}
            maxLength={4000}
          />
        </Field>
        <Field label="الوصف بالفرنسية">
          <Textarea
            value={draft.description_fr}
            onChange={(e) => set("description_fr", e.target.value)}
            rows={4}
            maxLength={4000}
            dir="ltr"
          />
        </Field>
        <Field label={t("common.category")}>
          <Input
            value={draft.category}
            onChange={(e) => set("category", e.target.value)}
            maxLength={60}
          />
        </Field>
        <Field label="الحالة">
          <Select
            value={status}
            onChange={(event) => onStatusChange(event.target.value as AdminProduct["status"])}
          >
            <option value="draft">{t("common.draft")}</option>
            <option value="published">{t("common.published")}</option>
            <option value="archived">{t("common.archived")}</option>
          </Select>
        </Field>
      </CardBody>
    </Card>
  );
}
