import { useQuery } from "@tanstack/react-query";
import { Home, Store } from "lucide-react";
import { Field, Select } from "@/components/ui/form";
import { useI18n } from "@/lib/i18n-context";
import { formatDzd } from "@/lib/format";
import { listPickupOffices } from "@/lib/server/guepex-actions";
import type { DeliveryMethod } from "@/lib/delivery";
import { cn } from "@/lib/utils";

/**
 * Home delivery or pickup at the carrier's office.
 *
 * Pickup is cheaper and many Algerian buyers prefer it, so it is offered
 * wherever the owner priced it, with both prices visible before choosing. The
 * office comes from the carrier's own list, because the carrier rejects a
 * parcel whose office id it does not know. Without a connected carrier there
 * is no list, and the shop confirms the office on the confirmation call.
 */
export function DeliveryChoice({
  wilaya,
  homeFee,
  pickupFee,
  method,
  officeId,
  onChange,
}: {
  wilaya: string;
  homeFee: number;
  pickupFee: number | null;
  method: DeliveryMethod;
  officeId: string;
  onChange: (next: { method: DeliveryMethod; officeId: string; officeName: string }) => void;
}) {
  const { t, locale } = useI18n();
  const offices = useQuery({
    queryKey: ["pickup_offices", wilaya] as const,
    queryFn: () => listPickupOffices({ data: { wilaya } }),
    enabled: method === "stopdesk" && Boolean(wilaya),
    staleTime: 3_600_000,
  });

  if (!wilaya || pickupFee === null) return null;

  const option = (value: DeliveryMethod, label: string, fee: number, Icon: typeof Home) => (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-[12px] border p-3.5 text-sm",
        method === value ? "border-primary bg-primary/5" : "border-outline",
      )}
    >
      <input
        type="radio"
        name="delivery_method"
        value={value}
        checked={method === value}
        onChange={() => onChange({ method: value, officeId: "", officeName: "" })}
        className="accent-[var(--primary-solid)]"
      />
      <Icon size={17} className="shrink-0 text-primary" aria-hidden="true" />
      <span className="flex-1">{label}</span>
      <span className="font-mono font-semibold" dir="ltr">
        {formatDzd(fee, locale)}
      </span>
    </label>
  );

  const list = offices.data ?? [];
  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="mb-1 text-sm font-medium">{t("checkout.method.title")}</legend>
      {option("home", t("checkout.method.home"), homeFee, Home)}
      {option("stopdesk", t("checkout.method.stopdesk"), pickupFee, Store)}

      {method === "stopdesk" &&
        (list.length > 0 ? (
          <Field label={t("checkout.stopdesk.choose")} required>
            <Select
              value={officeId}
              required
              onChange={(event) => {
                const office = list.find((o) => String(o.id) === event.target.value);
                onChange({
                  method,
                  officeId: event.target.value,
                  officeName: office ? office.name : "",
                });
              }}
            >
              <option value="">{t("checkout.stopdesk.choose")}</option>
              {list.map((office) => (
                <option key={office.id} value={office.id}>
                  {office.commune ? `${office.commune} — ` : ""}
                  {office.name}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          !offices.isPending && (
            <p className="rounded-[10px] bg-surface-mid px-3 py-2 text-xs text-on-surface-muted">
              {t("checkout.stopdesk.later")}
            </p>
          )
        ))}
    </fieldset>
  );
}
