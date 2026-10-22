import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Printer } from "lucide-react";
import { ShippingLabel } from "@/components/admin/shipping-label";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/feedback";
import { useI18n } from "@/lib/i18n-context";
import { useStoreSettings } from "@/lib/queries";
import { fetchOrders } from "@/lib/orders-file";
import { cn } from "@/lib/utils";

type Format = "label" | "a4";

export const Route = createFileRoute("/admin/slips")({
  validateSearch: (search: Record<string, unknown>): { id?: string; format?: Format } => ({
    id: typeof search.id === "string" ? search.id : undefined,
    format: search.format === "a4" ? "a4" : search.format === "label" ? "label" : undefined,
  }),
  component: SlipsPage,
});

// The printer's page size follows the chosen format. A 100 x 150 mm thermal
// printer needs that exact page; an office printer takes A4 with four labels.
const PAGE_CSS: Record<Format, string> = {
  label: "@page { size: 100mm 150mm; margin: 0; }",
  a4: "@page { size: A4; margin: 6mm; }",
};

/**
 * Shipping labels for one order (`?id=`) or every confirmed order, in either
 * format. The last format used is not remembered on purpose: the URL carries
 * it, so a bookmark opens straight onto the owner's printer size.
 */
function SlipsPage() {
  const { t } = useI18n();
  const navigate = useNavigate({ from: Route.fullPath });
  const { id, format = "label" } = Route.useSearch();
  const { data: settings } = useStoreSettings();
  const orders = useQuery({
    queryKey: ["admin_slips", id ?? "confirmed"] as const,
    queryFn: () => fetchOrders(id ? { id } : { status: "confirmed" }),
  });

  if (orders.isPending) return <LoadingState />;
  if (orders.isError) {
    return <ErrorState message={orders.error.message} onRetry={() => void orders.refetch()} />;
  }

  const list = orders.data;
  const choose = (next: Format) => void navigate({ search: (prev) => ({ ...prev, format: next }) });

  return (
    <div className="flex flex-col gap-6">
      <style>{PAGE_CSS[format]}</style>
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold">{t("admin.slip.title")}</h1>
        <div className="flex flex-wrap items-center gap-2">
          {(["label", "a4"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => choose(value)}
              aria-pressed={format === value}
              className={cn(
                "rounded-full px-4 py-2 text-sm",
                format === value ? "bg-primary text-on-primary" : "border border-outline",
              )}
            >
              {value === "label" ? t("admin.slip.formatLabel") : t("admin.slip.formatA4")}
            </button>
          ))}
          {list.length > 0 && (
            <Button onClick={() => window.print()}>
              <Printer size={16} aria-hidden="true" />
              {t("admin.slip.print")} ({list.length})
            </Button>
          )}
        </div>
      </div>
      {list.length === 0 ? (
        <EmptyState title={t("admin.slip.none")} />
      ) : (
        <div className={format === "a4" ? "label-sheet-a4" : "label-sheet-roll"} dir="ltr">
          {list.map((order) => (
            <ShippingLabel key={order.id} order={order} settings={settings} />
          ))}
        </div>
      )}
    </div>
  );
}
