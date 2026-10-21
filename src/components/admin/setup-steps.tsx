import { Field, Input, Switch } from "@/components/ui/form";
import { useI18n } from "@/lib/i18n-context";

/**
 * The four screens of the first-run wizard. Each is a plain form over a shared
 * draft; the route owns saving and moving between them.
 */
export type SetupDraft = {
  name: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  north: string;
  south: string;
  freeAbove: string;
  applyZones: boolean;
  legal_name: string;
  nif: string;
  rc_number: string;
};

type StepProps = {
  draft: SetupDraft;
  set: <K extends keyof SetupDraft>(key: K, value: SetupDraft[K]) => void;
};

export function ShopStep({ draft, set }: StepProps) {
  const { t } = useI18n();
  return (
    <>
      <Field label={t("common.name")} required>
        <Input
          value={draft.name}
          onChange={(e) => set("name", e.target.value)}
          required
          autoFocus
        />
      </Field>
      <Field label={t("admin.setup.tagline")}>
        <Input
          value={draft.tagline}
          onChange={(e) => set("tagline", e.target.value)}
          maxLength={120}
        />
      </Field>
    </>
  );
}

export function ContactStep({ draft, set, phoneError }: StepProps & { phoneError: string | null }) {
  const { t } = useI18n();
  return (
    <>
      <p className="text-sm text-on-surface-muted">{t("admin.setup.contactHint")}</p>
      <Field label={t("admin.setup.gap.phone")} error={phoneError} required>
        <Input
          type="tel"
          inputMode="tel"
          dir="ltr"
          placeholder="0555 12 34 56"
          value={draft.phone}
          onChange={(e) => set("phone", e.target.value)}
          required
          autoFocus
        />
      </Field>
      <Field label={t("admin.setup.gap.whatsapp")} hint={t("admin.setup.whatsappHint")}>
        <Input
          type="tel"
          inputMode="tel"
          dir="ltr"
          value={draft.whatsapp}
          onChange={(e) => set("whatsapp", e.target.value)}
        />
      </Field>
      <Field label="Email">
        <Input
          type="email"
          dir="ltr"
          value={draft.email}
          onChange={(e) => set("email", e.target.value)}
        />
      </Field>
      <Field label={t("checkout.address")}>
        <Input value={draft.address} onChange={(e) => set("address", e.target.value)} />
      </Field>
    </>
  );
}

export function DeliveryStep({ draft, set, zoneCount }: StepProps & { zoneCount: number }) {
  const { t } = useI18n();
  const number = (key: "north" | "south" | "freeAbove", label: string) => (
    <Field label={label}>
      <Input
        type="number"
        min={0}
        inputMode="numeric"
        dir="ltr"
        value={draft[key]}
        onChange={(e) => set(key, e.target.value)}
      />
    </Field>
  );
  return (
    <>
      <p className="text-sm text-on-surface-muted">{t("admin.setup.deliveryHint")}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {number("north", t("admin.setup.north"))}
        {number("south", t("admin.setup.south"))}
      </div>
      {number("freeAbove", t("admin.setup.freeAbove"))}
      <Switch
        label={t("admin.setup.applyAll")}
        checked={draft.applyZones}
        onChange={(e) => set("applyZones", e.target.checked)}
      />
      {zoneCount > 0 && (
        <p className="text-xs text-on-surface-muted">
          {t("admin.setup.zonesExist", { count: zoneCount })}
        </p>
      )}
    </>
  );
}

export function LegalStep({ draft, set }: StepProps) {
  const { t } = useI18n();
  return (
    <>
      <p className="text-sm text-on-surface-muted">{t("admin.setup.legalHint")}</p>
      <Field label={t("common.name")}>
        <Input value={draft.legal_name} onChange={(e) => set("legal_name", e.target.value)} />
      </Field>
      <Field label={t("admin.settings.nif")}>
        <Input dir="ltr" value={draft.nif} onChange={(e) => set("nif", e.target.value)} />
      </Field>
      <Field label={t("admin.settings.rc")}>
        <Input
          dir="ltr"
          value={draft.rc_number}
          onChange={(e) => set("rc_number", e.target.value)}
        />
      </Field>
    </>
  );
}
