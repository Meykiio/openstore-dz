import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Circle, MapPin, Package, Phone, Truck } from "lucide-react";
import { StoreLayout } from "@/components/storefront/store-layout";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/feedback";
import { translate } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n-context";
import { formatDateTime, formatDzd } from "@/lib/format";
import { ORDER_FLOW, isTerminal, trackOrder } from "@/lib/order";
import { wilayaLabel } from "@/lib/wilayas";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/order/$token")({
  head: ({ match }) => ({
    meta: [
      { title: translate(match.context.locale, "order.title") },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderPage,
});

function OrderPage() {
  const { token } = Route.useParams();
  const { t, locale } = useI18n();

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["track", token],
    queryFn: () => trackOrder(token),
    retry: false,
  });

  return (
    <StoreLayout>
      <div className="container-page flex max-w-3xl flex-col gap-6 py-8 sm:py-12">
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">{t("order.title")}</h1>

        {isPending ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState message={error.message} onRetry={() => void refetch()} />
        ) : !data ? (
          <EmptyState
            title={t("order.notFound")}
            action={
              <Button asChild variant="outline">
                <Link to="/track">{t("order.lookupTitle")}</Link>
              </Button>
            }
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-outline bg-surface p-5">
              <div>
                <p className="text-xs text-on-surface-muted">{t("order.tokenLabel")}</p>
                <p className="font-mono text-xs" dir="ltr">
                  {data.token}
                </p>
              </div>
              <StatusBadge status={data.status} />
            </div>

            {data.status === "pending" && (
              <p className="rounded-[16px] border border-tertiary/40 bg-tertiary/5 px-5 py-4 text-sm">
                {t("order.confirmNote")}
              </p>
            )}

            <Timeline status={data.status} />

            <section className="flex flex-col gap-3 rounded-[16px] border border-outline bg-surface p-5">
              <h2 className="flex items-center gap-2 font-medium">
                <Package size={16} className="text-primary" aria-hidden="true" />
                {t("order.items")}
              </h2>
              <ul className="flex flex-col gap-3">
                {data.items.map((item, index) => (
                  <li key={index} className="flex items-start justify-between gap-3 text-sm">
                    <span>
                      <span className="block">{item.product_name}</span>
                      <span className="text-xs text-on-surface-muted">
                        {item.variant_label} × {item.quantity}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-xs" dir="ltr">
                      {formatDzd(item.unit_price * item.quantity, locale)}
                    </span>
                  </li>
                ))}
              </ul>

              <dl className="flex flex-col gap-2 border-t border-outline pt-3 text-sm">
                <Row label={t("cart.subtotal")} value={formatDzd(data.subtotal, locale)} />
                <Row label={t("cart.delivery")} value={formatDzd(data.delivery_fee, locale)} />
                <div className="flex justify-between border-t border-outline pt-2 font-semibold">
                  <dt>{t("common.total")}</dt>
                  <dd className="font-mono text-primary" dir="ltr">
                    {formatDzd(data.total, locale)}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="flex flex-col gap-3 rounded-[16px] border border-outline bg-surface p-5 text-sm">
              <h2 className="flex items-center gap-2 font-medium">
                <MapPin size={16} className="text-primary" aria-hidden="true" />
                {t("order.customer")}
              </h2>
              <p>{data.customer_name}</p>
              <p className="flex items-center gap-2 text-on-surface-muted">
                <Phone size={14} aria-hidden="true" />
                <span dir="ltr" className="font-mono text-xs">
                  {data.phone}
                </span>
              </p>
              <p className="text-on-surface-muted">
                {wilayaLabel(data.wilaya, locale)}
                {data.commune ? ` — ${data.commune}` : ""}
              </p>
              <p className="text-on-surface-muted">{data.address}</p>
              {data.delivery_method === "stopdesk" && (
                <p className="mt-1 font-medium">
                  {t("checkout.method.stopdesk")}
                  {data.stopdesk_name ? `: ${data.stopdesk_name}` : ""}
                </p>
              )}
              {(data.carrier || data.tracking_number) && (
                <p className="flex items-center gap-2 text-on-surface-muted">
                  <Truck size={14} aria-hidden="true" />
                  {[data.carrier, data.tracking_number].filter(Boolean).join(" · ")}
                </p>
              )}
              <p className="text-xs text-on-surface-muted">
                {formatDateTime(data.created_at, locale)}
              </p>
            </section>
          </>
        )}
      </div>
    </StoreLayout>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-on-surface-muted">{label}</dt>
      <dd className="font-mono" dir="ltr">
        {value}
      </dd>
    </div>
  );
}

/**
 * Status timeline.
 *
 * Stages before the current one read as done, later ones as pending. A refused
 * or cancelled order leaves the flow, so nothing is marked done past the point
 * it stopped rather than implying progress that did not happen.
 */
function Timeline({ status }: { status: string }) {
  const { t } = useI18n();
  const stopped = isTerminal(status);
  const currentIndex = ORDER_FLOW.indexOf(status as (typeof ORDER_FLOW)[number]);

  return (
    <ol className="flex flex-col gap-0 rounded-[16px] border border-outline bg-surface p-5">
      {ORDER_FLOW.map((stage, index) => {
        const done = currentIndex >= 0 && index < currentIndex;
        const active = currentIndex === index;
        const failed = stopped && active;
        return (
          <li key={stage} className="flex gap-3">
            <span className="flex flex-col items-center">
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full border-2",
                  failed
                    ? "border-error text-error"
                    : done || active
                      ? "border-primary bg-primary text-on-primary"
                      : "border-outline text-on-surface-muted",
                )}
              >
                {done ? (
                  <CheckCircle2 size={14} aria-hidden="true" />
                ) : (
                  <Circle size={10} aria-hidden="true" />
                )}
              </span>
              {index < ORDER_FLOW.length - 1 && (
                <span
                  className={cn("w-0.5 flex-1", done ? "bg-primary" : "bg-outline")}
                  aria-hidden="true"
                />
              )}
            </span>
            <span className={cn("pb-6 text-sm", active ? "font-medium" : "text-on-surface-muted")}>
              {t(`status.${stage}` as "status.pending")}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
