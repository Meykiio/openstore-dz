import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { OrdersSection } from "@/components/admin/orders-section";
import {
  LowStock,
  RevenueChart,
  StatTile,
  TopProducts,
  WilayaTable,
} from "@/components/admin/dashboard-widgets";
import { ErrorState, LoadingState } from "@/components/ui/feedback";
import { useI18n } from "@/lib/i18n-context";
import { formatDzd } from "@/lib/format";
import { useAnalytics, refusalRate, wilayasToWatch } from "@/lib/analytics";
import { useOrdersPage, usePendingOrdersCount } from "@/lib/admin";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({
  component: DashboardPage,
});

type Range = 7 | 30 | 90;

function DashboardPage() {
  const { t, locale } = useI18n();
  const [range, setRange] = useState<Range>(30);
  const [queueOnly, setQueueOnly] = useState(false);
  const [page, setPage] = useState(1);

  const analytics = useAnalytics(range);
  // The queue is a server-side filter, not a re-sort of whatever happened to be
  // loaded. Loading the first page and filtering it in the browser would report a
  // queue size that depends on the page size.
  const orders = useOrdersPage(page, queueOnly ? "pending" : null);
  const pending = usePendingOrdersCount();

  const shown = orders.data?.rows ?? [];
  const total = orders.data?.total ?? 0;
  const pageCount = orders.data?.pageCount ?? 1;
  const queueCount = pending.data ?? 0;

  if (orders.isPending) return <LoadingState />;
  if (orders.isError) {
    return <ErrorState message={orders.error.message} onRetry={() => void orders.refetch()} />;
  }

  const data = analytics.data;
  const refusal = refusalRate(data);
  const watch = wilayasToWatch(data);
  const avgOrder =
    data && data.totals.orders > 0
      ? Math.round(data.totals.confirmedValue / Math.max(1, data.totals.orders))
      : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold">{t("admin.nav.overview")}</h1>
        <div className="flex items-center gap-2" data-testid="dashboard-range">
          {([7, 30, 90] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRange(value)}
              className={cn(
                "inline-flex min-h-9 items-center rounded-full px-3.5 text-xs transition-colors",
                range === value
                  ? "bg-primary text-on-primary"
                  : "border border-outline text-on-surface-muted hover:bg-surface-mid",
              )}
            >
              {t(`admin.chart.days${value}` as "admin.chart.days30")}
            </button>
          ))}
        </div>
      </div>

      {analytics.isError ? (
        <ErrorState message={analytics.error.message} onRetry={() => void analytics.refetch()} />
      ) : (
        <>
          {/* The four numbers that answer "how is the shop doing". */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label={t("admin.chart.confirmedValue")}
              value={formatDzd(data?.totals.confirmedValue ?? 0, locale)}
              tone="positive"
            />
            <StatTile
              label={t("admin.chart.refusalRate")}
              value={`${Math.round(refusal * 100)}%`}
              tone={refusal >= 0.2 ? "danger" : refusal > 0 ? "warning" : "positive"}
              hint={`${data?.totals.refused ?? 0} / ${data?.totals.orders ?? 0}`}
            />
            <StatTile label={t("admin.chart.avgOrder")} value={formatDzd(avgOrder, locale)} />
            <StatTile
              label={t("admin.orders.needsCall")}
              value={String(queueCount)}
              tone={queueCount > 0 ? "warning" : "positive"}
            />
          </div>

          {/* Every order stays on the page, so nothing appears to vanish when it
              is confirmed. The queue is a filter, and its count comes from the
              server so it does not depend on how many rows are loaded. */}
          <OrdersSection
            orders={shown}
            total={total}
            queueCount={queueCount}
            queueOnly={queueOnly}
            onToggleQueue={() => setQueueOnly((value) => !value)}
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
          />

          {data && (
            <div className="grid gap-4 xl:grid-cols-2" data-testid="dashboard-analytics">
              <RevenueChart days={data.revenue} locale={locale} />
              <WilayaTable analytics={data} />
              <TopProducts analytics={data} />
              <LowStock analytics={data} />
            </div>
          )}

          {watch.length > 0 && (
            <p className="rounded-[16px] border border-error/40 bg-error/5 px-5 py-4 text-sm">
              <strong className="font-medium">{t("admin.chart.watch")}:</strong>{" "}
              {watch.map((row) => row.wilaya).join(", ")}
            </p>
          )}

          {data && data.totals.orders === 0 && (
            <p className="rounded-[16px] border border-outline bg-surface px-5 py-4 text-sm text-on-surface-muted">
              {t("admin.chart.needMoreData")}{" "}
              <Link to="/" className="text-primary hover:underline">
                {t("nav.shop")}
              </Link>
            </p>
          )}
        </>
      )}
    </div>
  );
}
