import { PhoneCall } from "lucide-react";
import { AdminOrderList } from "./order-list";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n-context";
import type { AdminOrder } from "@/lib/admin";

/**
 * The orders section of the dashboard.
 *
 * Extracted from the page when that function passed the 120-line limit, and the
 * seam is the real one: this is one self-contained block with its own controls,
 * and the page around it is analytics.
 *
 * The queue is a filter, not a re-sort. Its count comes from the server, so the
 * badge reports the real queue size rather than however many rows happen to be
 * loaded, and the list pages independently of it.
 */
export function OrdersSection({
  orders,
  total,
  queueCount,
  queueOnly,
  onToggleQueue,
  hasNextPage,
  loadingMore,
  onLoadMore,
}: {
  orders: AdminOrder[];
  total: number;
  queueCount: number;
  queueOnly: boolean;
  onToggleQueue: () => void;
  hasNextPage: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
}) {
  const { t } = useI18n();

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <PhoneCall size={17} className="text-primary" aria-hidden="true" />
          {t("admin.orders.title")}
          {queueCount > 0 && (
            <span className="grid size-6 place-items-center rounded-full bg-tertiary text-xs font-semibold text-on-tertiary">
              {queueCount}
            </span>
          )}
        </h2>
        <span className="flex items-center gap-2">
          {/* How much of the list is on screen. Without it, a paged list and a
              complete one look identical. */}
          <span className="font-mono text-xs text-on-surface-muted" data-testid="orders-count">
            {orders.length} / {total}
          </span>
          <Button
            variant={queueOnly ? "primary" : "ghost"}
            size="sm"
            aria-pressed={queueOnly}
            onClick={onToggleQueue}
          >
            {queueOnly ? t("admin.orders.all") : t("admin.orders.queue")}
          </Button>
        </span>
      </div>

      <AdminOrderList orders={orders} />

      {hasNextPage && (
        <Button
          variant="outline"
          className="self-center"
          data-testid="orders-load-more"
          disabled={loadingMore}
          onClick={onLoadMore}
        >
          {loadingMore ? t("common.loading") : t("common.loadMore")}
        </Button>
      )}
    </section>
  );
}
