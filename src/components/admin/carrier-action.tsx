import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PackageCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n-context";
import type { AdminOrder } from "@/lib/admin";
import { getSupabase } from "@/lib/supabase/client";
import { createParcelForOrder } from "@/lib/server/guepex-actions";

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
