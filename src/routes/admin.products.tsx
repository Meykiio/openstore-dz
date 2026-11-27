import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { ProductRow } from "@/components/admin/product-row";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/feedback";
import { Field, Input, Select } from "@/components/ui/form";
import { Pagination } from "@/components/ui/pagination";
import { useI18n } from "@/lib/i18n-context";
import {
  createProduct,
  suggestSlug,
  useAdminProductsPage,
  useInvalidateAdminProducts,
} from "@/lib/admin-products";

export const Route = createFileRoute("/admin/products")({
  component: ProductsPage,
});

function ProductsPage() {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const products = useAdminProductsPage(page);
  const [open, setOpen] = useState(false);

  if (products.isPending) return <LoadingState />;
  if (products.isError) {
    return <ErrorState message={products.error.message} onRetry={() => void products.refetch()} />;
  }

  const list = products.data?.rows ?? [];
  const total = products.data?.total ?? 0;
  const pageCount = products.data?.pageCount ?? 1;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold">{t("admin.products.title")}</h1>
        <span className="flex items-center gap-3">
          {/* A paged list and a complete one look identical without this. */}
          <span className="font-mono text-xs text-on-surface-muted" data-testid="products-total">
            {total}
          </span>
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} aria-hidden="true" />
            {t("admin.products.new")}
          </Button>
        </span>
      </div>

      {list.length === 0 ? (
        <EmptyState
          title={t("store.empty.title")}
          action={<Button onClick={() => setOpen(true)}>{t("admin.products.new")}</Button>}
        />
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {list.map((product) => (
              <ProductRow key={product.id} product={product} />
            ))}
          </ul>

          <Pagination
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
            testId="products-pagination"
          />
        </>
      )}

      <CreateProductDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function CreateProductDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const invalidate = useInvalidateAdminProducts();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [kind, setKind] = useState<"single" | "pack">("single");

  const create = useMutation({
    mutationFn: () => createProduct({ name, slug, kind }),
    onSuccess: (id) => {
      invalidate();
      onClose();
      setName("");
      setSlug("");
      toast.success(t("admin.products.created"));
      void navigate({ to: "/admin/product/$id", params: { id } });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t("admin.products.new")}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            disabled={!name.trim() || !slug.trim() || create.isPending}
            onClick={() => create.mutate()}
          >
            {create.isPending ? t("common.saving") : t("common.add")}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label={t("common.name")} required>
          <Input
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (!slug || slug === suggestSlug(name)) setSlug(suggestSlug(event.target.value));
            }}
            maxLength={120}
            autoFocus
          />
        </Field>
        <Field label={t("admin.products.slug")} required>
          <Input
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            dir="ltr"
            className="font-mono"
            maxLength={80}
          />
        </Field>
        <Field label={t("admin.products.kind")}>
          <Select
            value={kind}
            onChange={(event) => setKind(event.target.value as "single" | "pack")}
          >
            <option value="single">{t("admin.products.single")}</option>
            <option value="pack">{t("admin.products.pack")}</option>
          </Select>
        </Field>
      </div>
    </Dialog>
  );
}
