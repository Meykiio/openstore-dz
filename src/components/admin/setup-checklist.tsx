import { Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { useDeliveryZones } from "@/lib/delivery";
import { useI18n } from "@/lib/i18n-context";
import { useStoreSettings } from "@/lib/queries";
import { setupGaps } from "@/lib/setup-status";

/**
 * The dashboard's nag. Shown while anything buyers see is missing or a demo
 * value, and gone the moment it is not. Placed above the numbers, because a
 * shop with a fake phone number has no numbers worth reading yet.
 */
export function SetupChecklist() {
  const { t } = useI18n();
  const settings = useStoreSettings();
  const zones = useDeliveryZones();
  if (settings.isPending || zones.isPending) return null;

  const gaps = setupGaps(settings.data ?? null, zones.data?.length ?? 0);
  if (gaps.length === 0) return null;

  return (
    <section className="flex flex-col gap-3 rounded-[16px] border border-tertiary/40 bg-tertiary/5 p-5 sm:flex-row sm:items-center">
      <AlertTriangle size={20} className="shrink-0 text-tertiary" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <h2 className="font-semibold">{t("admin.setup.checklist")}</h2>
        <p className="mt-0.5 text-sm text-on-surface-muted">
          {t("admin.setup.checklistBody")}{" "}
          {gaps.map((gap) => t(`admin.setup.gap.${gap}`)).join(" · ")}
        </p>
      </div>
      <Link to="/admin/welcome" className="btn btn-primary btn-sm self-start sm:self-auto">
        {t("admin.setup.resume")}
      </Link>
    </section>
  );
}
