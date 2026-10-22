import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PackageCheck, Store } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n-context";
import type { AdminOrder } from "@/lib/admin";
import { getSupabase } from "@/lib/supabase/client";
import { createParcelForOrder, listPickupOffices } from "@/lib/server/guepex-actions";
import { Select } from "@/components/ui/form";

/**
 * Create the carrier parcel.
 *
 * Only offered on a confirmed order with no tracking number yet, because sending
 * twice would cost twice. The server re-verifies that the caller is an admin and
 * reads the address and price from the database — nothing here is trusted.
 */
export function CarrierAction({ order }: { order: AdminOrder }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await getSupabase().auth.getSession();
      const accessToken = data.session?.access_token;
      if (!accessToken) throw new Error("Not signed in.");
      const result = await createParcelForOrder({ data: { orderId: order.id, accessToken } });
      if (!result.ok) throw new Error(result.error);
      return result.tracking;
    },
    onSuccess: (tracking) => {
      void queryClient.invalidateQueries({ queryKey: ["admin_orders"] });
      toast.success(`تم إنشاء الطرد: ${tracking}`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (order.tracking_number || order.status !== "confirmed") return null;

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="berry"
        size="sm"
        className="self-start"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        <PackageCheck size={15} aria-hidden="true" />
        {mutation.isPending ? t("common.loading") : t("admin.orders.sendParcel")}
      </Button>
      {mutation.isError && (
        <p className="text-xs text-error" role="alert">
          {mutation.error.message}
        </p>
      )}
    </div>
  );
}

/**
 * Where a pickup order goes. The buyer chose an office at checkout when the
 * carrier's list was available; otherwise the owner picks it here, usually
 * during the confirmation call, before the parcel can be created.
 */
export function PickupOffice({ order }: { order: AdminOrder }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const missing = order.delivery_method === "stopdesk" && !order.stopdesk_id;
  const offices = useQuery({
    queryKey: ["pickup_offices", order.wilaya] as const,
    queryFn: () => listPickupOffices({ data: { wilaya: order.wilaya } }),
    enabled: missing,
    staleTime: 3_600_000,
  });
  const save = useMutation({
    mutationFn: async (office: { id: number; name: string }) => {
      const { error } = await getSupabase()
        .from("orders")
        .update({ stopdesk_id: office.id, stopdesk_name: office.name })
        .eq("id", order.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin_orders"] }),
    onError: (error: Error) => toast.error(error.message),
  });

  if (order.delivery_method !== "stopdesk") return null;
  const list = offices.data ?? [];

  return (
    <div className="flex flex-col gap-2 rounded-[10px] bg-surface-mid px-3 py-2 text-sm">
      <p className="flex items-center gap-2 font-medium">
        <Store size={15} className="text-primary" aria-hidden="true" />
        {t("admin.orders.pickup")}
        {order.stopdesk_name ? `: ${order.stopdesk_name}` : ""}
      </p>
      {missing && (
        <>
          <p className="text-xs text-tertiary">{t("admin.orders.pickupMissing")}</p>
          {list.length > 0 && (
            <Select
              aria-label={t("checkout.stopdesk.choose")}
              value=""
              disabled={save.isPending}
              onChange={(event) => {
                const office = list.find((o) => String(o.id) === event.target.value);
                if (office) save.mutate(office);
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
          )}
        </>
      )}
    </div>
  );
}
