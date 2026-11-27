import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { ImageOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useI18n } from "@/lib/i18n-context";
import { formatDzd } from "@/lib/format";
import { priceRange, productImage } from "@/lib/queries";
import { deleteProduct, useInvalidateAdminProducts, type AdminProduct } from "@/lib/admin-products";
import { setProductStatus, statusErrorMessage } from "@/lib/product-status";

/** One row of the admin product list: status, price, and the publish toggle. */
export function ProductRow({ product }: { product: AdminProduct }) {
  const { t, locale } = useI18n();
  const invalidate = useInvalidateAdminProducts();
  const [confirming, setConfirming] = useState(false);

  const image = productImage(product as never);
  const range = priceRange(product as never);
  const variants = product.product_variants.length;
  const stock = product.product_variants.reduce((sum, v) => sum + v.stock, 0);
  const published = product.status === "published";

  // Left enabled when the product has nothing to sell: the guard refuses the
  // write and the toast says why, which beats a dead button on a phone.
  const toggle = useMutation({
    mutationFn: () => setProductStatus(product.id, published ? "draft" : "published"),
    onSuccess: invalidate,
    onError: (mutationError: Error) =>
      toast.error(statusErrorMessage(mutationError, t("admin.products.noVariants"))),
  });

  const remove = useMutation({
    mutationFn: () => deleteProduct(product.id),
    onSuccess: invalidate,
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const statusLabel =
    product.status === "published"
      ? t("common.published")
      : product.status === "archived"
        ? t("common.archived")
        : t("common.draft");

  return (
    <li className="flex flex-wrap items-center gap-4 rounded-[16px] border border-outline bg-surface p-3">
      <div className="size-14 shrink-0 overflow-hidden rounded-[10px] bg-surface-high">
        {image ? (
          <img src={image} alt="" className="size-full object-cover" loading="lazy" />
        ) : (
          <span className="grid size-full place-items-center text-on-surface-muted">
            <ImageOff size={18} aria-hidden="true" />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/product/$id"
            params={{ id: product.id }}
            className="font-medium hover:text-primary"
          >
            {product.name}
          </Link>
          <Badge tone={product.status === "published" ? "positive" : "neutral"}>
            {statusLabel}
          </Badge>
          {product.kind === "pack" && <Badge tone="primary">{t("admin.products.pack")}</Badge>}
        </div>
        <p className="mt-1 text-xs text-on-surface-muted">
          {variants} {t("admin.products.variants")} · {stock} {t("common.quantity")}
          {range ? ` · ${formatDzd(range.min, locale)}` : ""}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={toggle.isPending}
          onClick={() => toggle.mutate()}
        >
          {published ? t("admin.products.unpublish") : t("admin.products.publish")}
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/product/$id" params={{ id: product.id }}>
            {t("common.edit")}
          </Link>
        </Button>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={remove.isPending}
          aria-label={`${t("common.delete")} ${product.name}`}
          className="text-on-surface-muted hover:text-error"
        >
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </div>

      {confirming && (
        <ConfirmDialog
          title={product.name}
          message={t("admin.confirm.deleteProduct")}
          onConfirm={() => remove.mutateAsync()}
          onClose={() => setConfirming(false)}
        />
      )}
    </li>
  );
}
