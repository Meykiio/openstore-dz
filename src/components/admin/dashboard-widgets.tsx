import { AlertTriangle, Package, TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n-context";
import { formatDzd } from "@/lib/format";
import { wilayaLabel } from "@/lib/wilayas";
import {
  revenueTrend,
  WORRYING_REFUSAL_RATE,
  type Analytics,
  type RevenueDay,
} from "@/lib/analytics";
import { cn } from "@/lib/utils";

/**
 * Dashboard widgets.
 *
 * Dense and readable at a glance, deliberately not styled like the storefront.
 * A dashboard is a working tool: the owner scans it in ten seconds between
 * phone calls, so whitespace that makes a product page breathe makes this
 * slower to read.
 */

export function StatTile({
  label,
  value,
  hint,
  tone,
  trend,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "warning" | "danger" | "positive";
  trend?: number | null;
}) {
  return (
    <div className="rounded-[16px] border border-outline bg-surface px-5 py-4">
      <p className="text-xs text-on-surface-muted">{label}</p>
      <p
        className={cn(
          "mt-1 font-mono text-2xl font-semibold tabular-nums",
          tone === "warning" && "text-tertiary",
          tone === "danger" && "text-error",
          tone === "positive" && "text-positive",
        )}
        dir="ltr"
      >
        {value}
      </p>
      <div className="mt-1 flex items-center gap-2">
        {hint && <span className="text-xs text-on-surface-muted">{hint}</span>}
        {trend !== undefined && trend !== null && <TrendPill change={trend} />}
      </div>
    </div>
  );
}

function TrendPill({ change }: { change: number }) {
  const up = change >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        up ? "bg-positive/12 text-positive" : "bg-error/12 text-error",
      )}
    >
      <Icon size={12} aria-hidden="true" />
      <span dir="ltr">{Math.round(Math.abs(change) * 100)}%</span>
    </span>
  );
}

/**
 * Revenue over time.
 *
 * Drawn as inline SVG rather than pulling in a charting library for one chart.
 * A dependency for this would be 50 KB to draw a polyline, and the shapes here
 * are simple enough to reason about directly.
 */
export function RevenueChart({ days, locale }: { days: RevenueDay[]; locale: "ar" | "fr" | "en" }) {
  const { t } = useI18n();
  const trend = revenueTrend({ revenue: days } as Analytics);

  if (days.length === 0) return null;

  const max = Math.max(...days.map((day) => day.value), 1);
  const width = 100;
  const height = 32;
  const step = days.length > 1 ? width / (days.length - 1) : width;
  const points = days
    .map(
      (day, index) =>
        `${(index * step).toFixed(2)},${(height - (day.value / max) * height).toFixed(2)}`,
    )
    .join(" ");
  const total = days.reduce((sum, day) => sum + day.value, 0);

  return (
    <section className="rounded-[16px] border border-outline bg-surface p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold">{t("admin.chart.revenue")}</h2>
        <span className="flex items-center gap-2">
          <span className="font-mono text-lg font-semibold" dir="ltr">
            {formatDzd(total, locale)}
          </span>
          {trend !== null && <TrendPill change={trend} />}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-24 w-full"
        role="img"
        aria-label={`${t("admin.chart.revenue")}: ${formatDzd(total, locale)}`}
      >
        <polyline
          points={points}
          fill="none"
          stroke="var(--primary-solid)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <polyline
          points={`0,${height} ${points} ${width},${height}`}
          fill="var(--primary-glow-sm)"
          stroke="none"
        />
      </svg>

      <div className="mt-2 flex justify-between font-mono text-[10px] text-on-surface-muted">
        <span>{days[0]?.day.slice(5)}</span>
        <span>{days[days.length - 1]?.day.slice(5)}</span>
      </div>
    </section>
  );
}

/**
 * Refusal rate by wilaya.
 *
 * The number that decides whether a COD shop makes money. A refused parcel
 * costs the outbound and the return, so a wilaya above the threshold is one to
 * stop serving or to require an up-front payment for.
 */
export function WilayaTable({ analytics }: { analytics: Analytics }) {
  const { t, locale } = useI18n();
  const rows = analytics.byWilaya;

  if (rows.length === 0) {
    return (
      <section className="rounded-[16px] border border-outline bg-surface p-5">
        <h2 className="text-sm font-semibold">{t("admin.chart.wilaya")}</h2>
        <p className="mt-2 text-xs text-on-surface-muted">{t("admin.chart.needMoreData")}</p>
      </section>
    );
  }

  return (
    <section className="rounded-[16px] border border-outline bg-surface p-5">
      <h2 className="mb-3 text-sm font-semibold">{t("admin.chart.wilaya")}</h2>
      <div className="overflow-x-auto">
        <table className="ds-table">
          <caption className="sr-only">{t("admin.chart.wilaya")}</caption>
          <thead>
            <tr>
              <th scope="col">{t("checkout.wilaya")}</th>
              <th scope="col">{t("admin.chart.orders")}</th>
              <th scope="col">{t("admin.chart.delivered")}</th>
              <th scope="col">{t("admin.chart.refused")}</th>
              <th scope="col">{t("admin.chart.rate")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const worrying = row.rate >= WORRYING_REFUSAL_RATE;
              return (
                <tr key={row.wilaya}>
                  <td>
                    <span className="flex items-center gap-2">
                      {wilayaLabel(row.wilaya, locale)}
                      {worrying && (
                        <AlertTriangle size={13} className="text-error" aria-hidden="true" />
                      )}
                    </span>
                  </td>
                  <td className="cell-mono">{row.total}</td>
                  <td className="cell-mono">{row.delivered}</td>
                  <td className="cell-mono">{row.refused}</td>
                  <td>
                    <Badge tone={worrying ? "danger" : row.rate > 0 ? "warning" : "positive"}>
                      <span dir="ltr">{Math.round(row.rate * 100)}%</span>
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function TopProducts({ analytics }: { analytics: Analytics }) {
  const { t, locale } = useI18n();
  if (analytics.topProducts.length === 0) return null;

  return (
    <section className="rounded-[16px] border border-outline bg-surface p-5">
      <h2 className="mb-3 text-sm font-semibold">{t("admin.chart.topProducts")}</h2>
      <ul className="flex flex-col gap-2.5">
        {analytics.topProducts.map((product) => (
          <li key={product.name} className="flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">{product.name}</span>
            <span className="shrink-0 font-mono text-xs text-on-surface-muted" dir="ltr">
              {product.units} × {formatDzd(product.value, locale)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function LowStock({ analytics }: { analytics: Analytics }) {
  const { t } = useI18n();
  if (analytics.lowStock.length === 0) return null;

  return (
    <section className="rounded-[16px] border border-tertiary/40 bg-tertiary/5 p-5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Package size={15} className="text-tertiary" aria-hidden="true" />
        {t("admin.chart.lowStock")}
      </h2>
      <ul className="flex flex-col gap-2.5">
        {analytics.lowStock.map((row) => (
          <li key={row.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">
              {row.product}
              {row.label && <span className="text-on-surface-muted"> ({row.label})</span>}
            </span>
            <Badge tone={row.stock === 0 ? "danger" : "warning"}>
              <span dir="ltr">{row.stock}</span>
            </Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}
