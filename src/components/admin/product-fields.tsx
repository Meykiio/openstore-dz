import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n-context";
import { useCategories } from "@/lib/queries";
import type { AdminProduct } from "@/lib/admin-products";

/** The editable text fields of a product. */
export type ProductDraft = {
  name: string;
  name_fr: string;
  description: string;
  description_fr: string;
  category_id: string;
};

export function ProductFieldsCard({
  draft,
  set,
  status,
  onStatusChange,
}: {
  draft: ProductDraft;
  set: <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) => void;
  status: string;
  onStatusChange: (status: AdminProduct["status"]) => void;
}) {
  const { t } = useI18n();
  const { data: categories } = useCategories();

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

        {/* A select, not free text. A typed category used to silently create a
            new one on every typo, which is why categories are entities now. */}
        <Field
          label={t("common.category")}
          hint={categories && categories.length === 0 ? "أنشئ فئة أولاً" : undefined}
        >
          <Select
            value={draft.category_id}
            onChange={(event) => set("category_id", event.target.value)}
          >
            <option value="">{t("common.none")}</option>
            {(categories ?? []).map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
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
