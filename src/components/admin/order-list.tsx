import { useState } from "react";
import { ChevronDown, MapPin, Phone } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { useI18n } from "@/lib/i18n-context";
import { formatDateTime, formatDzd } from "@/lib/format";
import { wilayaLabel } from "@/lib/wilayas";
import type { AdminOrder } from "@/lib/admin";
import { OrderDetail } from "./order-detail";
import { PhoneBadge } from "./phone-guard";
import { canonicalPhone, usePhoneHistory, type PhoneHistory } from "@/lib/admin-phones";
import { cn } from "@/lib/utils";

/**
 * Order queue.
 *
 * The confirmation call is the single highest-value action on this screen: on
 * cash-on-delivery a refused parcel costs the outbound and return shipping and
 * destroys the margin on several successful orders. So `pending` is styled as a
 * warning and carries the phone number as a tap-to-dial link, while every later
 * status is quiet by comparison.
 */
export function AdminOrderList({ orders }: { orders: AdminOrder[] }) {
  const { t } = useI18n();
  const history = usePhoneHistory(orders.map((order) => order.phone));
  if (orders.length === 0) return <EmptyState title={t("admin.orders.empty")} />;
  return (
    <ul className="flex flex-col gap-3" data-testid="order-list">
      {orders.map((order) => (
        <OrderRow
          key={order.id}
          order={order}
          history={history.data?.get(canonicalPhone(order.phone))}
        />
      ))}
    </ul>
  );
}

function OrderRow({ order, history }: { order: AdminOrder; history: PhoneHistory | undefined }) {
  const { t, locale } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const itemCount = order.order_items.reduce((sum, item) => sum + item.quantity, 0);
  const pending = order.status === "pending";

  return (
    <li
      className={cn(
        "rounded-[16px] border bg-surface",
        pending ? "border-tertiary/50" : "border-outline",
      )}
    >
      <div className="flex flex-wrap items-start gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{order.customer_name}</p>
            <StatusBadge status={order.status} />
            <PhoneBadge history={history} />
            {pending && (
              <span className="text-xs font-medium text-tertiary">
                {t("admin.orders.needsCall")}
              </span>
            )}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-muted">
            <a
              href={`tel:${order.phone.replace(/\s/g, "")}`}
              className="flex items-center gap-1.5 font-mono hover:text-primary"
              dir="ltr"
            >
              <Phone size={12} aria-hidden="true" />
              {order.phone}
            </a>
            <span className="flex items-center gap-1.5">
              <MapPin size={12} aria-hidden="true" />
              {wilayaLabel(order.wilaya, locale)}
            </span>
            <span>{formatDateTime(order.created_at, locale)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-end">
            <p className="font-mono font-semibold" dir="ltr">
              {formatDzd(order.total, locale)}
            </p>
            <p className="text-xs text-on-surface-muted">
              {t("admin.orders.itemCount", { count: itemCount })}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setExpanded((open) => !open)}
            aria-expanded={expanded}
            aria-label={t("admin.orders.detail")}
            className="btn btn-ghost btn-icon !rounded-full !border !border-outline"
          >
            <ChevronDown
              size={16}
              className={cn("transition-transform", expanded && "rotate-180")}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {expanded && <OrderDetail order={order} history={history} />}
    </li>
  );
}
