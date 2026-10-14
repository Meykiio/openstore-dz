import { PhoneCall } from "lucide-react";
import { AdminOrderList } from "./order-list";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
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
  page,
  pageCount,
  queueCount,
  queueOnly,
  onToggleQueue,
  onPageChange,
}: {
  orders: AdminOrder[];
  total: number;
  page: number;
  pageCount: number;
  queueCount: number;
  queueOnly: boolean;
  onToggleQueue: () => void;
  onPageChange: (page: number) => void;
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
          {/* How many orders exist in total, not how many are on screen. Without
              it, a page of fifteen and a shop with fifteen look identical. */}
          <span className="font-mono text-xs text-on-surface-muted" data-testid="orders-total">
            {total}
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

      <Pagination
        page={page}
        pageCount={pageCount}
        onPageChange={onPageChange}
        testId="orders-pagination"
      />
    </section>
  );
}
