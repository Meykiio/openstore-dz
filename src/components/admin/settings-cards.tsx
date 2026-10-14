import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Switch, Textarea } from "@/components/ui/form";
import { useI18n } from "@/lib/i18n-context";
import type { StoreSettings } from "@/lib/queries";

/**
 * The form sections on the settings page.
 *
 * Split out of `admin.settings.tsx` when that file passed the 250-line limit. The
 * seam is the real one: the page owns fetching the row, holding the draft and
 * saving it; these sections own rendering one slice of that row and nothing else.
 */

export type SettingsDraft = StoreSettings;
export type SettingsSetter = <K extends keyof SettingsDraft>(
  key: K,
  value: SettingsDraft[K],
) => void;

export function IdentityCard({ form, set }: { form: SettingsDraft; set: SettingsSetter }) {
  const { t } = useI18n();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("admin.settings.identity")}</CardTitle>
      </CardHeader>
      <CardBody className="grid gap-4 sm:grid-cols-2">
        <Field label={t("common.name")} required className="sm:col-span-2">
          <Input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            required
            maxLength={120}
          />
        </Field>
        <Field label={t("admin.settings.tagline")} className="sm:col-span-2">
          <Input
            value={form.tagline ?? ""}
            onChange={(e) => set("tagline", e.target.value || null)}
            maxLength={160}
          />
        </Field>
        <Field label={t("common.description")} className="sm:col-span-2">
          <Textarea
            value={form.description ?? ""}
            onChange={(e) => set("description", e.target.value || null)}
            rows={3}
            maxLength={1000}
          />
        </Field>
        <Field label={t("admin.settings.logoUrl")}>
          <Input
            value={form.logo_url ?? ""}
            onChange={(e) => set("logo_url", e.target.value || null)}
            dir="ltr"
            type="url"
          />
        </Field>
        <Field label={t("admin.settings.bannerUrl")}>
          <Input
            value={form.banner_url ?? ""}
            onChange={(e) => set("banner_url", e.target.value || null)}
            dir="ltr"
            type="url"
          />
        </Field>
      </CardBody>
    </Card>
  );
}

export function LegalCard({ form, set }: { form: SettingsDraft; set: SettingsSetter }) {
  const { t } = useI18n();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("admin.settings.legal")}</CardTitle>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        <p className="rounded-[10px] bg-surface-mid px-4 py-3 text-xs text-on-surface-muted">
          {t("admin.settings.legalNote")}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("admin.settings.nif")}>
            <Input
              value={form.nif ?? ""}
              onChange={(e) => set("nif", e.target.value || null)}
              dir="ltr"
              className="font-mono"
              maxLength={40}
            />
          </Field>
          <Field label={t("admin.settings.rc")}>
            <Input
              value={form.rc_number ?? ""}
              onChange={(e) => set("rc_number", e.target.value || null)}
              dir="ltr"
              className="font-mono"
              maxLength={40}
            />
          </Field>
          <Field label={t("checkout.phone")}>
            <Input
              value={form.phone ?? ""}
              onChange={(e) => set("phone", e.target.value || null)}
              dir="ltr"
              type="tel"
            />
          </Field>
          <Field label={t("admin.settings.whatsapp")}>
            <Input
              value={form.whatsapp ?? ""}
              onChange={(e) => set("whatsapp", e.target.value || null)}
              dir="ltr"
              type="tel"
            />
          </Field>
          <Field label={t("admin.login.email")}>
            <Input
              value={form.email ?? ""}
              onChange={(e) => set("email", e.target.value || null)}
              dir="ltr"
              type="email"
            />
          </Field>
          <Field label={t("admin.settings.legalName")}>
            <Input
              value={form.legal_name ?? ""}
              onChange={(e) => set("legal_name", e.target.value || null)}
              maxLength={160}
            />
          </Field>
          <Field label={t("admin.settings.address")} className="sm:col-span-2">
            <Input
              value={form.address ?? ""}
              onChange={(e) => set("address", e.target.value || null)}
              maxLength={300}
            />
          </Field>
        </div>
      </CardBody>
    </Card>
  );
}

export function CommerceCard({ form, set }: { form: SettingsDraft; set: SettingsSetter }) {
  const { t } = useI18n();
  const numberField = (
    key: "delivery_fee_flat" | "delivery_eta_days" | "returns_days" | "free_shipping_threshold",
    label: string,
    min: number,
    hint?: string,
  ) => (
    <Field label={label} hint={hint}>
      <Input
        type="number"
        min={min}
        value={form[key]}
        onChange={(e) => set(key, Number(e.target.value) || 0)}
        dir="ltr"
        className="font-mono"
      />
    </Field>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("admin.settings.commerce")}</CardTitle>
      </CardHeader>
      <CardBody className="grid gap-4 sm:grid-cols-2">
        {numberField("delivery_fee_flat", t("admin.settings.deliveryFee"), 0)}
        {numberField(
          "free_shipping_threshold",
          t("admin.settings.freeShippingFrom"),
          0,
          t("admin.settings.freeShippingHint"),
        )}
        {numberField("delivery_eta_days", t("admin.settings.etaDays"), 1)}
        {numberField("returns_days", t("admin.settings.returnsDays"), 0)}
        <div className="sm:col-span-2">
          <Switch
            label={t("checkout.codTitle")}
            checked={form.accepts_cod}
            onChange={(e) => set("accepts_cod", e.target.checked)}
          />
        </div>
      </CardBody>
    </Card>
  );
}
