import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n-context";
import { deleteOrder } from "@/lib/admin";
import { PHONE_HISTORY_KEY } from "@/lib/admin-phones";

/**
 * Delete an order, after an inline second tap (no `confirm()` or `<dialog>`,
 * which some phone browsers block). For test orders and duplicates; a real
 * order the owner turned down is refused, not deleted, so it stays on record.
 */
export function DeleteOrderButton({ orderId }: { orderId: string }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [asking, setAsking] = useState(false);

  const mutation = useMutation({
    mutationFn: () => deleteOrder(orderId),
    onSuccess: () => {
      toast.success(t("admin.orders.deleted"));
      void queryClient.invalidateQueries({ queryKey: ["admin_orders"] });
      // A deleted order no longer counts in that number's history.
      void queryClient.invalidateQueries({ queryKey: [PHONE_HISTORY_KEY] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
      setAsking(false);
    },
  });

  if (!asking) {
    return (
      <Button variant="ghost" size="sm" className="text-error" onClick={() => setAsking(true)}>
        <Trash2 size={14} aria-hidden="true" />
        {t("admin.orders.delete")}
      </Button>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2 rounded-[10px] border border-error/40 bg-error/5 p-3">
      <p className="text-sm" role="alert">
        {t("admin.orders.deleteConfirm")}
      </p>
      <span className="flex gap-2">
        <Button
          variant="danger"
          size="sm"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          <Trash2 size={14} aria-hidden="true" />
          {t("admin.orders.delete")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={mutation.isPending}
          onClick={() => setAsking(false)}
        >
          {t("common.cancel")}
        </Button>
      </span>
    </div>
  );
}
