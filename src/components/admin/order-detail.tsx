import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, PackageCheck, Truck, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { useI18n } from "@/lib/i18n-context";
import { formatDzd } from "@/lib/format";
import { wilayaLabel } from "@/lib/wilayas";
import { setOrderStatus, type AdminOrder, type OrderStatus } from "@/lib/admin";
import { getSupabase } from "@/lib/supabase/client";
import { createParcelForOrder } from "@/lib/server/guepex-actions";

/** Expanded order: lines, money, recipient, and the status transitions. */
export function OrderDetail({ order }: { order: AdminOrder }) {
  const { t, locale } = useI18n();
  return (
    <div className="flex flex-col gap-4 border-t border-outline px-4 py-4">
      <ul className="flex flex-col gap-2 text-sm">
        {order.order_items.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-3">
            <span>
              <span className="block">{item.product_name}</span>
              <span className="text-xs text-on-surface-muted">
                {item.variant_label} × {item.quantity}
              </span>
            </span>
            <span className="shrink-0 font-mono text-xs" dir="ltr">
              {formatDzd(item.unit_price * item.quantity, locale)}
            </span>
          </li>
        ))}
      </ul>

      <dl className="flex flex-col gap-1 border-t border-outline pt-3 text-sm">
        <div className="flex justify-between text-on-surface-muted">
          <dt>{t("cart.subtotal")}</dt>
          <dd className="font-mono" dir="ltr">
            {formatDzd(order.subtotal, locale)}
          </dd>
        </div>
        <div className="flex justify-between text-on-surface-muted">
          <dt>{t("cart.delivery")}</dt>
          <dd className="font-mono" dir="ltr">
            {formatDzd(order.delivery_fee, locale)}
          </dd>
        </div>
        <div className="flex justify-between font-semibold">
          <dt>{t("common.total")}</dt>
          <dd className="font-mono text-primary" dir="ltr">
            {formatDzd(order.total, locale)}
          </dd>
        </div>
      </dl>

      <div className="text-sm">
        <p className="text-on-surface-muted">
          {wilayaLabel(order.wilaya, locale)}
          {order.commune ? ` — ${order.commune}` : ""}
        </p>
        <p>{order.address}</p>
        {order.note && (
          <p className="mt-2 rounded-[10px] bg-surface-mid px-3 py-2 text-xs">{order.note}</p>
        )}
      </div>

      {order.refused_reason && (
        <p className="text-xs text-error">
          {t("status.refused")}: {order.refused_reason}
        </p>
      )}

      <OrderActions order={order} />
      <CarrierAction order={order} />
    </div>
  );
}

/**
 * Create the carrier parcel.
 *
 * Only offered on a confirmed order with no tracking number yet, because sending
 * twice would cost twice. The server re-verifies that the caller is an admin and
 * reads the address and price from the database — nothing here is trusted.
 */
function CarrierAction({ order }: { order: AdminOrder }) {
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

/** Status transitions. Only forward moves are offered, matching the flow. */
function OrderActions({ order }: { order: AdminOrder }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [refusing, setRefusing] = useState(false);
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: async (input: { status: OrderStatus; reason?: string }) => {
      const extra =
        input.status === "confirmed"
          ? { confirmed_at: new Date().toISOString(), refused_at: null, refused_reason: null }
          : input.status === "refused"
            ? { refused_at: new Date().toISOString(), refused_reason: input.reason ?? null }
            : {};
      await setOrderStatus(order.id, input.status, extra);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin_orders"] });
      setRefusing(false);
      setReason("");
    },
  });

  if (mutation.isError) {
    return (
      <p className="text-sm text-error" role="alert">
        {mutation.error.message}
      </p>
    );
  }

  if (refusing) {
    return (
      <div className="flex flex-col gap-3 rounded-[10px] border border-error/40 bg-error/5 p-3">
        <Field label={t("admin.orders.refuse")}>
          <Input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t("admin.orders.refusePlaceholder")}
            maxLength={200}
          />
        </Field>
        <span className="flex gap-2">
          <Button
            variant="danger"
            size="sm"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate({ status: "refused", reason })}
          >
            {t("common.confirm")}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setRefusing(false)}>
            {t("common.cancel")}
          </Button>
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {order.status === "pending" && (
        <>
          <Button
            size="sm"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate({ status: "confirmed" })}
          >
            <Check size={15} aria-hidden="true" />
            {t("admin.orders.confirm")}
          </Button>
          <Button variant="danger" size="sm" onClick={() => setRefusing(true)}>
            <X size={15} aria-hidden="true" />
            {t("admin.orders.refuse")}
          </Button>
        </>
      )}
      {order.status === "confirmed" && (
        <Button
          size="sm"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate({ status: "shipped" })}
        >
          <Truck size={15} aria-hidden="true" />
          {t("admin.orders.ship")}
        </Button>
      )}
      {order.status === "shipped" && (
        <Button
          size="sm"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate({ status: "delivered" })}
        >
          <Check size={15} aria-hidden="true" />
          {t("admin.orders.delivered")}
        </Button>
      )}
    </div>
  );
}
