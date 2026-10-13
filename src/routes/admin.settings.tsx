import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Textarea, Switch } from "@/components/ui/form";
import { LoadingState } from "@/components/ui/feedback";
import { useI18n } from "@/lib/i18n-context";
import { useStoreSettings, type StoreSettings } from "@/lib/queries";
import { saveStoreSettings } from "@/lib/admin";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

const DEFAULTS: StoreSettings = {
  id: 1,
  name: "",
  tagline: null,
  description: null,
  logo_url: null,
  banner_url: null,
  legal_name: null,
  nif: null,
  rc_number: null,
  phone: null,
  whatsapp: null,
  email: null,
  address: null,
  free_shipping_threshold: 0,
  currency: "DZD",
  delivery_fee_flat: 600,
  delivery_wilayas: [],
  delivery_eta_days: 3,
  returns_days: 14,
  accepts_cod: true,
  guepex_from_wilaya: null,
};

type Draft = StoreSettings;
type Setter = <K extends keyof Draft>(key: K, value: Draft[K]) => void;

function SettingsPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { data, isPending } = useStoreSettings();
  const [form, setForm] = useState<Draft>(DEFAULTS);

  // Seed the form once the row arrives. Without this the fields stay on
  // DEFAULTS and a save would blank the shop.
  useEffect(() => {
    if (data) setForm({ ...DEFAULTS, ...data });
  }, [data]);

  const mutation = useMutation({
    mutationFn: (patch: Partial<StoreSettings>) => saveStoreSettings(patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["store_settings"] });
      toast.success(t("admin.settings.saved"));
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isPending) return <LoadingState />;

  const set: Setter = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        // Never send the immutable id back.
        const { id: _id, ...rest } = form;
        void _id;
        mutation.mutate(rest);
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold">{t("admin.settings.title")}</h1>
        <Button type="submit" disabled={mutation.isPending}>
          <Save size={16} aria-hidden="true" />
          {mutation.isPending ? t("common.saving") : t("common.save")}
        </Button>
      </div>

      <IdentityCard form={form} set={set} />
      <LegalCard form={form} set={set} />
      <CommerceCard form={form} set={set} />
    </form>
  );
}

function IdentityCard({ form, set }: { form: Draft; set: Setter }) {
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
        <Field label="الشعار النصي" className="sm:col-span-2">
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
        <Field label="رابط الشعار">
          <Input
            value={form.logo_url ?? ""}
            onChange={(e) => set("logo_url", e.target.value || null)}
            dir="ltr"
            type="url"
          />
        </Field>
        <Field label="رابط صورة الغلاف">
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

function LegalCard({ form, set }: { form: Draft; set: Setter }) {
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
          <Field label="واتساب">
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
          <Field label="الاسم القانوني">
            <Input
              value={form.legal_name ?? ""}
              onChange={(e) => set("legal_name", e.target.value || null)}
              maxLength={160}
            />
          </Field>
          <Field label="العنوان" className="sm:col-span-2">
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

function CommerceCard({ form, set }: { form: Draft; set: Setter }) {
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
        {numberField("free_shipping_threshold", "توصيل مجاني بدءاً من", 0, "0 لإخفائه")}
        {numberField("delivery_eta_days", "مدة التوصيل (أيام)", 1)}
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
