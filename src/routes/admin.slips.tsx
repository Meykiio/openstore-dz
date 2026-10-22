import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/feedback";
import { useI18n } from "@/lib/i18n-context";
import { formatDateTime, formatDzd } from "@/lib/format";
import { useStoreSettings } from "@/lib/queries";
import { fetchOrders } from "@/lib/orders-file";
import { wilayaLabel } from "@/lib/wilayas";
import type { AdminOrder } from "@/lib/admin";

export const Route = createFileRoute("/admin/slips")({
  validateSearch: (search: Record<string, unknown>): { id?: string } => ({
    id: typeof search.id === "string" ? search.id : undefined,
  }),
  component: SlipsPage,
});

/**
 * Packing slips, ready for the printer.
 *
 * One order with `?id=`, otherwise every confirmed order: the day's parcels in
 * one print run. The amount to collect is the largest thing on the slip,
 * because on cash on delivery it is the number the courier must not get wrong.
 */
function SlipsPage() {
  const { t } = useI18n();
  const { id } = Route.useSearch();
  const orders = useQuery({
    queryKey: ["admin_slips", id ?? "confirmed"] as const,
    queryFn: () => fetchOrders(id ? { id } : { status: "confirmed" }),
  });

  if (orders.isPending) return <LoadingState />;
  if (orders.isError) {
    return <ErrorState message={orders.error.message} onRetry={() => void orders.refetch()} />;
  }

  const list = orders.data;
  return (
    <div className="flex flex-col gap-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold">{t("admin.slip.title")}</h1>
        {list.length > 0 && (
          <Button onClick={() => window.print()}>
            <Printer size={16} aria-hidden="true" />
            {t("admin.slip.print")} ({list.length})
          </Button>
        )}
      </div>
      {list.length === 0 ? (
        <EmptyState title={t("admin.slip.none")} />
      ) : (
        list.map((order) => <Slip key={order.id} order={order} />)
      )}
    </div>
  );
}

function Slip({ order }: { order: AdminOrder }) {
  const { t, locale } = useI18n();
  const { data: settings } = useStoreSettings();

  return (
    <article className="slip flex flex-col gap-4 text-sm">
      <header className="flex items-start justify-between gap-4 border-b border-outline pb-3">
        <div>
          <p className="text-xs text-on-surface-muted">{t("admin.slip.from")}</p>
          <p className="font-semibold">{settings?.name}</p>
          <p dir="ltr" className="font-mono text-xs">
            {settings?.phone}
          </p>
        </div>
        <div className="text-end">
          <p className="font-mono text-base font-semibold" dir="ltr">
            #{order.public_token.slice(0, 8).toUpperCase()}
          </p>
          <p className="text-xs text-on-surface-muted">
            {formatDateTime(order.created_at, locale)}
          </p>
        </div>
      </header>

      <section>
        <p className="text-xs text-on-surface-muted">{t("admin.slip.to")}</p>
        <p className="text-lg font-semibold">{order.customer_name}</p>
        <p dir="ltr" className="font-mono">
          {order.phone}
        </p>
        <p>
          {wilayaLabel(order.wilaya, locale)}
          {order.commune ? ` — ${order.commune}` : ""}
        </p>
        <p>{order.address}</p>
      </section>

      <ul className="flex flex-col gap-1 border-y border-outline py-3">
        {order.order_items.map((item) => (
          <li key={item.id} className="flex justify-between gap-3">
            <span>
              {item.product_name}
              {item.variant_label ? ` — ${item.variant_label}` : ""}
            </span>
            <span className="font-mono">× {item.quantity}</span>
          </li>
        ))}
      </ul>

      {order.note && <p className="rounded-[8px] bg-surface-mid px-3 py-2 text-xs">{order.note}</p>}

      <p className="flex items-baseline justify-between gap-3">
        <span className="font-semibold">{t("admin.slip.collect")}</span>
        <span className="font-mono text-2xl font-bold" dir="ltr">
          {formatDzd(order.total, locale)}
        </span>
      </p>
    </article>
  );
}
