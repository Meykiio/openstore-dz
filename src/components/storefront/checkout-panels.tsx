import { Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n-context";
import { formatDzd } from "@/lib/format";
import { WILAYAS } from "@/lib/wilayas";
import { useStoreSettings } from "@/lib/queries";
import { useCommunes } from "@/lib/communes";
import type { CheckoutForm } from "@/lib/checkout-form";

export function AddressFields({
  form,
  onChange,
}: {
  form: CheckoutForm;
  onChange: (next: CheckoutForm) => void;
}) {
  const { t, locale } = useI18n();
  const { data: settings } = useStoreSettings();
  const communes = useCommunes(form.wilaya);
  const set = <K extends keyof CheckoutForm>(key: K, value: CheckoutForm[K]) =>
    onChange({ ...form, [key]: value });

  // Restrict the picker to wilayas the owner actually serves. An empty list
  // means everywhere. The database enforces the same rule, so this is courtesy
  // rather than control — but offering 58 options when 6 are served is how a
  // buyer picks one that gets rejected at the last step.
  const allowed = settings?.delivery_wilayas ?? [];
  const deliverable =
    allowed.length === 0 ? WILAYAS : WILAYAS.filter((w) => allowed.includes(w.fr));

  return (
    <div className="flex flex-col gap-4 rounded-[16px] border border-outline bg-surface p-6">
      <h2 className="font-display text-lg font-semibold">{t("checkout.yourInfo")}</h2>

      <Field label={t("checkout.fullName")} required>
        <Input
          value={form.customer_name}
          onChange={(e) => set("customer_name", e.target.value)}
          autoComplete="name"
          required
          minLength={2}
          maxLength={120}
        />
      </Field>

      <Field label={t("checkout.phone")} hint={t("checkout.phoneHint")} required>
        <Input
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          type="tel"
          inputMode="tel"
          dir="ltr"
          autoComplete="tel"
          placeholder="0555 12 34 56"
          required
          pattern="[0-9+\s\-]{8,20}"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("checkout.wilaya")} required>
          <Select
            value={form.wilaya}
            // A new wilaya invalidates the commune and the pickup office chosen
            // for the old one.
            onChange={(e) =>
              onChange({
                ...form,
                wilaya: e.target.value,
                commune: "",
                delivery_method: "home",
                stopdesk_id: "",
                stopdesk_name: "",
              })
            }
            required
          >
            <option value="">{t("checkout.selectWilaya")}</option>
            {deliverable.map((w) => (
              <option key={w.code} value={w.fr}>
                {String(w.code).padStart(2, "0")} — {locale === "ar" ? w.ar : w.fr}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label={t("checkout.commune")}
          hint={communes.length > 0 ? t("checkout.communeHint") : undefined}
        >
          <Input
            value={form.commune}
            onChange={(e) => set("commune", e.target.value)}
            maxLength={80}
            list="commune-options"
            autoComplete="address-level2"
          />
          {/* Suggestions, not a lock: a commune missing from the list can still be typed. */}
          <datalist id="commune-options">
            {communes.map(([latin, arabic]) => (
              <option key={latin} value={latin}>
                {arabic}
              </option>
            ))}
          </datalist>
        </Field>
      </div>

      <Field label={t("checkout.address")} hint={t("checkout.addressHint")} required>
        <Textarea
          value={form.address}
          onChange={(e) => set("address", e.target.value)}
          required
          minLength={5}
          maxLength={500}
          rows={3}
        />
      </Field>

      <Field label={t("checkout.note")}>
        <Textarea
          value={form.note}
          onChange={(e) => set("note", e.target.value)}
          maxLength={1000}
          rows={2}
        />
      </Field>
    </div>
  );
}

/** Cash-on-delivery reassurance. Above the fold on purpose: it is the reason
 *  a first-time Algerian buyer completes the order. */
export function CodNotice() {
  const { t } = useI18n();
  return (
    <p className="flex items-start gap-3 rounded-[16px] border border-primary/30 bg-primary/5 p-4 text-sm">
      <Banknote size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
      <span>
        <strong className="block font-medium">{t("checkout.codTitle")}</strong>
        <span className="text-on-surface-muted">{t("checkout.codBody")}</span>
      </span>
    </p>
  );
}

export function CheckoutSummary({
  deliveryFee,
  hasWilaya,
  error,
  submitting,
}: {
  deliveryFee: number;
  hasWilaya: boolean;
  error: string | null;
  submitting: boolean;
}) {
  const { t, locale } = useI18n();
  const { items, subtotal } = useCart();
  const total = subtotal + deliveryFee;

  return (
    <aside className="flex flex-col gap-4 self-start rounded-[16px] border border-outline bg-surface p-6 lg:sticky lg:top-24">
      <h2 className="font-display text-lg font-semibold">{t("checkout.summary")}</h2>

      <ul className="flex flex-col gap-3">
        {items.map((line) => (
          <li key={line.variantId} className="flex items-start justify-between gap-3 text-sm">
            <span className="min-w-0">
              <span className="line-clamp-2">{line.name}</span>
              <span className="block text-xs text-on-surface-muted">
                {line.variantLabel} × {line.quantity}
              </span>
            </span>
            <span className="shrink-0 font-mono text-xs" dir="ltr">
              {formatDzd(line.unitPrice * line.quantity, locale)}
            </span>
          </li>
        ))}
      </ul>

      <dl className="flex flex-col gap-2 border-t border-outline pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-on-surface-muted">{t("cart.subtotal")}</dt>
          <dd className="font-mono" dir="ltr">
            {formatDzd(subtotal, locale)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-on-surface-muted">{t("cart.delivery")}</dt>
          <dd className="font-mono" dir="ltr">
            {hasWilaya ? formatDzd(deliveryFee, locale) : t("cart.deliveryCalculated")}
          </dd>
        </div>
        <div className="flex justify-between border-t border-outline pt-2 text-base font-semibold">
          <dt>{t("common.total")}</dt>
          <dd className="font-mono text-primary" dir="ltr">
            {formatDzd(total, locale)}
          </dd>
        </div>
      </dl>

      {error && (
        <p className="rounded-[10px] bg-error/10 px-3 py-2 text-sm text-error" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" variant="berry" size="lg" disabled={submitting}>
        {submitting ? t("checkout.placing") : t("checkout.placeOrder")}
      </Button>
    </aside>
  );
}
