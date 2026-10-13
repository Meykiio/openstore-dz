import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminOrderList } from "@/components/admin/order-list";
import { LoadingState, ErrorState } from "@/components/ui/feedback";
import { useAdminOrders, isOpenOrder, needsCall, type AdminOrder } from "@/lib/admin";
import { useI18n } from "@/lib/i18n-context";
import { formatDzd } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({
  component: DashboardPage,
});

type Filter = "queue" | "open" | "all";

function DashboardPage() {
  const { t, locale } = useI18n();
  const { data: orders, isPending, isError, error, refetch } = useAdminOrders();
  const [filter, setFilter] = useState<Filter>("queue");

  const stats = useMemo(() => {
    const list = orders ?? [];
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const today = list.filter((order) => new Date(order.created_at) >= startOfDay).length;
    const pending = list.filter(needsCall).length;
    // Only confirmed-and-beyond counts as value: a pending order may still be
    // refused on the phone, so counting it would overstate the day.
    const revenue = list
      .filter((order) => ["confirmed", "shipped", "delivered"].includes(order.status))
      .reduce((sum, order) => sum + order.total, 0);
    return { today, pending, revenue };
  }, [orders]);

  const visible = useMemo<AdminOrder[]>(() => {
    const list = orders ?? [];
    if (filter === "queue") return list.filter(needsCall);
    if (filter === "open") return list.filter(isOpenOrder);
    return list;
  }, [orders, filter]);

  if (isPending) return <LoadingState />;
  if (isError) return <ErrorState message={error.message} onRetry={() => void refetch()} />;

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: "queue", label: t("admin.orders.queue"), count: stats.pending },
    {
      key: "open",
      label: t("admin.orders.title"),
      count: (orders ?? []).filter(isOpenOrder).length,
    },
    { key: "all", label: t("admin.orders.all"), count: (orders ?? []).length },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold">{t("admin.nav.overview")}</h1>

      <dl className="grid gap-3 sm:grid-cols-3">
        <Stat label={t("admin.stats.ordersToday")} value={String(stats.today)} />
        <Stat label={t("admin.stats.pending")} value={String(stats.pending)} tone="warning" />
        <Stat label={t("admin.stats.revenue")} value={formatDzd(stats.revenue, locale)} mono />
      </dl>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label={t("admin.orders.title")}>
        {filters.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={filter === item.key}
            onClick={() => setFilter(item.key)}
            className={cn(
              "rounded-full px-4 py-2 text-sm transition-colors",
              filter === item.key
                ? "bg-primary text-on-primary"
                : "border border-outline text-on-surface-muted hover:bg-surface-mid",
            )}
          >
            {item.label}
            <span className="ms-2 font-mono text-xs opacity-80">{item.count}</span>
          </button>
        ))}
      </div>

      <AdminOrderList orders={visible} />
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  mono,
}: {
  label: string;
  value: string;
  tone?: "warning";
  mono?: boolean;
}) {
  return (
    <div className="rounded-[16px] border border-outline bg-surface px-5 py-4">
      <dt className="text-xs text-on-surface-muted">{label}</dt>
      <dd
        className={cn(
          "mt-1 text-xl font-semibold",
          mono && "font-mono",
          tone === "warning" && "text-tertiary",
        )}
        dir={mono ? "ltr" : undefined}
      >
        {value}
      </dd>
    </div>
  );
}
