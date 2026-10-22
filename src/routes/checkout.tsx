import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { StoreLayout } from "@/components/storefront/store-layout";
import {
  AddressFields,
  CheckoutSummary,
  CodNotice,
  EMPTY_CHECKOUT_FORM,
  type CheckoutForm,
} from "@/components/storefront/checkout-panels";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n-context";
import { useStoreSettings } from "@/lib/queries";
import { resolveDelivery, useDeliveryZones } from "@/lib/delivery";
import { isDemoShop } from "@/components/storefront/demo-banner";
import { placeOrder } from "@/lib/order";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "إتمام الطلب" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { t } = useI18n();
  const cart = useCart();
  const { data: settings } = useStoreSettings();
  const { data: zones } = useDeliveryZones();

  const [form, setForm] = useState<CheckoutForm>(EMPTY_CHECKOUT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placedToken, setPlacedToken] = useState<string | null>(null);

  if (placedToken) return <OrderPlaced token={placedToken} phone={form.phone} />;

  // The owner can close the shop without deleting it. Cash on delivery is the
  // only payment method, so `accepts_cod = false` means no orders at all. The
  // database refuses them too, via validate_order.
  if (settings && !settings.accepts_cod) {
    return (
      <StoreLayout>
        <div className="container-page py-16">
          <EmptyState
            title={t("shop.closed")}
            body={t("shop.closedBody")}
            action={
              <Button asChild variant="secondary">
                <Link to="/">{t("cart.emptyAction")}</Link>
              </Button>
            }
          />
        </div>
      </StoreLayout>
    );
  }

  if (cart.items.length === 0) {
    return (
      <StoreLayout>
        <div className="container-page py-16">
          <EmptyState
            title={t("cart.empty")}
            action={
              <Button asChild variant="secondary">
                <Link to="/">{t("cart.emptyAction")}</Link>
              </Button>
            }
          />
        </div>
      </StoreLayout>
    );
  }

  const delivery = resolveDelivery(
    settings ?? null,
    zones ?? [],
    form.wilaya || null,
    cart.subtotal,
  );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await placeOrder(
      {
        customer_name: form.customer_name,
        phone: form.phone,
        wilaya: form.wilaya,
        commune: form.commune || null,
        address: form.address,
        note: form.note || null,
      },
      cart.items.map((line) => ({ variant_id: line.variantId, quantity: line.quantity })),
    );
    setSubmitting(false);
    if (result.error || !result.token) {
      // Known refusals are translated; anything else is the database's own message,
      // which is written for a human.
      setError(
        result.code
          ? t(`checkout.error.${result.code}`)
          : (result.error ?? t("common.somethingWrong")),
      );
      return;
    }
    cart.clear();
    setPlacedToken(result.token);
  };

  return (
    <StoreLayout>
      <div className="container-page py-10">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-on-surface-muted hover:text-on-surface"
        >
          <ArrowLeft size={16} className="rtl:rotate-180" aria-hidden="true" />
          {t("cart.continueShopping")}
        </Link>

        <h1 className="mb-6 font-display text-2xl font-semibold sm:text-3xl">
          {t("checkout.title")}
        </h1>

        <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          <div className="flex flex-col gap-5">
            {isDemoShop && (
              <p
                role="note"
                className="rounded-[10px] border border-tertiary/40 bg-tertiary/10 px-4 py-3 text-sm font-medium"
              >
                {t("demo.checkout")}
              </p>
            )}
            <AddressFields form={form} onChange={setForm} />
            <CodNotice />
          </div>

          <CheckoutSummary
            deliveryFee={delivery.fee}
            hasWilaya={Boolean(form.wilaya)}
            error={error}
            submitting={submitting}
          />
        </form>
      </div>
    </StoreLayout>
  );
}

function OrderPlaced({ token, phone }: { token: string; phone: string }) {
  const { t } = useI18n();
  return (
    <StoreLayout>
      <div className="container-page flex flex-col items-center gap-5 py-20 text-center">
        <CheckCircle2 size={40} className="text-positive" aria-hidden="true" />
        <h1 className="font-display text-2xl font-semibold">{t("checkout.orderPlaced")}</h1>
        <p className="max-w-md text-on-surface-muted">{t("checkout.orderPlacedBody", { phone })}</p>
        <p className="rounded-[10px] border border-outline bg-surface px-4 py-3 font-mono text-xs">
          {token}
        </p>
        <Button asChild size="lg">
          <Link to="/order/$token" params={{ token }}>
            {t("checkout.trackNow")}
          </Link>
        </Button>
      </div>
    </StoreLayout>
  );
}
