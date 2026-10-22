import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { CategoryRow } from "@/components/admin/category-row";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/feedback";
import { Field, Input } from "@/components/ui/form";
import { useI18n } from "@/lib/i18n-context";
import {
  ADMIN_CATEGORIES_KEY,
  createCategory,
  deleteCategory,
  updateCategory,
  useAdminCategories,
  type AdminCategory,
} from "@/lib/admin-categories";

export const Route = createFileRoute("/admin/categories")({
  component: CategoriesPage,
});

/**
 * Categories, without SQL.
 *
 * Before this screen an owner could pick a category for a product but had no
 * way to create one, so a new shop had exactly the categories its seed came
 * with. Order is a plain up/down pair: drag-and-drop is fiddly on the phone
 * most owners run their shop from.
 */
function CategoriesPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { data, isPending, isError, error, refetch } = useAdminCategories();
  const [name, setName] = useState("");
  const [nameFr, setNameFr] = useState("");

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ADMIN_CATEGORIES_KEY });
    // The storefront and the product form both read the public list.
    void queryClient.invalidateQueries({ queryKey: ["categories"] });
  };
  const onError = (mutationError: Error) => toast.error(mutationError.message);

  const create = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      invalidate();
      setName("");
      setNameFr("");
    },
    onError,
  });
  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof updateCategory>[1] }) =>
      updateCategory(id, patch),
    onSuccess: invalidate,
    onError,
  });
  const remove = useMutation({ mutationFn: deleteCategory, onSuccess: invalidate, onError });

  if (isPending) return <LoadingState />;
  if (isError) return <ErrorState message={error.message} onRetry={() => void refetch()} />;

  const list = data ?? [];
  const busy = create.isPending || update.isPending || remove.isPending;

  // Swap with the neighbour. Sort orders are renumbered 0..n first, so two
  // categories that both started at 0 still move.
  const move = (index: number, direction: -1 | 1) => {
    const neighbour = list[index + direction];
    if (!neighbour) return;
    list.forEach((category, position) => {
      const target =
        position === index ? index + direction : position === index + direction ? index : position;
      if (category.sort_order !== target) {
        update.mutate({ id: category.id, patch: { sort_order: target } });
      }
    });
  };

  const confirmDelete = (category: AdminCategory) => {
    const message = t("admin.categories.deleteConfirm", { count: category.product_count });
    if (category.product_count === 0 || window.confirm(message)) remove.mutate(category.id);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">{t("admin.nav.categories")}</h1>
        <p className="mt-1 max-w-xl text-sm text-on-surface-muted">{t("admin.categories.intro")}</p>
      </div>

      <Card>
        <CardBody>
          <form
            className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              create.mutate({
                name: name.trim(),
                name_fr: nameFr.trim() || null,
                sort_order: list.length,
              });
            }}
          >
            <Field label={t("admin.categories.name")} required>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                dir="rtl"
                required
                minLength={2}
              />
            </Field>
            <Field
              label={t("admin.categories.nameLatin")}
              hint={t("admin.categories.nameLatinHint")}
            >
              <Input value={nameFr} onChange={(e) => setNameFr(e.target.value)} dir="ltr" />
            </Field>
            <Button type="submit" disabled={busy || name.trim().length < 2}>
              <Plus size={16} aria-hidden="true" />
              {t("admin.categories.add")}
            </Button>
          </form>
        </CardBody>
      </Card>

      {list.length === 0 ? (
        <EmptyState title={t("admin.categories.empty")} />
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((category, index) => (
            <CategoryRow
              key={`${category.id}-${category.name}-${category.name_fr ?? ""}`}
              category={category}
              first={index === 0}
              last={index === list.length - 1}
              busy={busy}
              onRename={(newName, newNameFr) =>
                update.mutate({ id: category.id, patch: { name: newName, name_fr: newNameFr } })
              }
              onToggle={() =>
                update.mutate({ id: category.id, patch: { is_active: !category.is_active } })
              }
              onMove={(direction) => move(index, direction)}
              onDelete={() => confirmDelete(category)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
