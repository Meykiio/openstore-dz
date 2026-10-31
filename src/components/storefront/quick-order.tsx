import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddressFields } from "@/components/storefront/checkout-panels";
import { CopyBox } from "@/components/storefront/copy-box";
import { DeliveryChoice } from "@/components/storefront/delivery-choice";
import { isDemoShop } from "@/components/storefront/demo-banner";
import { EMPTY_CHECKOUT_FORM, toCustomer, type CheckoutForm } from "@/lib/checkout-form";
import { pickupFee, resolveDelivery, useDeliveryZones } from "@/lib/delivery";
import { formatDzd } from "@/lib/format";
import { useI18n } from "@/lib/i18n-context";
import { placeOrder } from "@/lib/order";
import { useStoreSettings, type CatalogueVariant } from "@/lib/queries";

/**
 * The order form on the product page. Most Algerian buyers order where they pick
 * the size, without a cart: this places the chosen variant straight away, with
 * the same fields and the same database checks as the checkout. The cart stays
 * for buyers who want several products. Totals here are display only; the
 * database computes the total it stores.
 */
export function QuickOrder({
  selected,
  quantity,
}: {
  selected: CatalogueVariant;
  quantity: number;
}) {
  const { t, locale } = useI18n();
  const { data: settings } = useStoreSettings();
  const { data: zones } = useDeliveryZones();
  const [form, setForm] = useState<CheckoutForm>(EMPTY_CHECKOUT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<string | null>(null);

  if (placed) return <QuickOrderPlaced token={placed} phone={form.phone} />;
  if (settings && !settings.accepts_cod) return null;

  const subtotal = selected.price * quantity;
  const wilaya = form.wilaya || null;
  const delivery = resolveDelivery(
    settings ?? null,
    zones ?? [],
    wilaya,
    subtotal,
    form.delivery_method,
  );
  const homeFee = resolveDelivery(settings ?? null, zones ?? [], wilaya, subtotal).fee;
  const pickup = pickupFee(zones ?? [], wilaya);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await placeOrder(toCustomer(form), [{ variant_id: selected.id, quantity }]);
    setSubmitting(false);
    if (result.error || !result.token) {
      setError(
        result.code
          ? t(`checkout.error.${result.code}`)
          : (result.error ?? t("common.somethingWrong")),
      );
      return;
    }
    setPlaced(result.token);
  };

  const row = (label: string, value: string, strong = false) => (
    <div
      className={strong ? "flex justify-between text-base font-semibold" : "flex justify-between"}
    >
      <dt className={strong ? undefined : "text-on-surface-muted"}>{label}</dt>
      <dd className="font-mono" dir="ltr">
        {value}
      </dd>
    </div>
  );

  return (
    <form
      id="order-form"
      onSubmit={submit}
      className="flex scroll-mt-24 flex-col gap-4 border-t border-outline pt-5"
    >
      <h2 className="font-display text-lg font-semibold">{t("quick.title")}</h2>
      {isDemoShop && (
        <p
          role="note"
          className="rounded-[10px] border border-tertiary/40 bg-tertiary/10 px-4 py-3 text-sm font-medium"
        >
          {t("demo.checkout")}
        </p>
      )}
      <AddressFields form={form} onChange={setForm} />
      <DeliveryChoice
        wilaya={form.wilaya}
        homeFee={homeFee}
        // Free delivery covers pickup too, so both options show the same 0.
        pickupFee={pickup === null ? null : delivery.source === "free" ? 0 : pickup}
        method={form.delivery_method}
        officeId={form.stopdesk_id}
        onChange={({ method, officeId, officeName }) =>
          setForm({
            ...form,
            delivery_method: method,
            stopdesk_id: officeId,
            stopdesk_name: officeName,
          })
        }
      />
      <dl className="flex flex-col gap-2 rounded-[12px] bg-surface-mid p-4 text-sm">
        {row(t("cart.subtotal"), formatDzd(subtotal, locale))}
        {row(
          t("cart.delivery"),
          wilaya ? formatDzd(delivery.fee, locale) : t("cart.deliveryCalculated"),
        )}
        {row(t("common.total"), formatDzd(subtotal + (wilaya ? delivery.fee : 0), locale), true)}
      </dl>
      {error && (
        <p className="rounded-[10px] bg-error/10 px-3 py-2 text-sm text-error" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" variant="berry" size="lg" disabled={submitting}>
        {submitting ? t("checkout.placing") : t("quick.submit")}
      </Button>
    </form>
  );
}

/** Same message as after a cart checkout, in place of the form. */
function QuickOrderPlaced({ token, phone }: { token: string; phone: string }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center gap-4 rounded-[16px] border border-outline bg-surface p-6 text-center">
      <CheckCircle2 size={36} className="text-positive" aria-hidden="true" />
      <h2 className="font-display text-xl font-semibold">{t("checkout.orderPlaced")}</h2>
      <p className="text-sm text-on-surface-muted">{t("checkout.orderPlacedBody", { phone })}</p>
      <div className="flex w-full flex-col gap-2 text-start">
        <p className="text-sm font-medium">{t("order.copyHint")}</p>
        <CopyBox value={token} />
      </div>
      <Button asChild size="lg">
        <Link to="/order/$token" params={{ token }}>
          {t("checkout.trackNow")}
        </Link>
      </Button>
    </div>
  );
}
