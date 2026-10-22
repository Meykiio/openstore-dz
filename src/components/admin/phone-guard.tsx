import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ban, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n-context";
import { PHONE_HISTORY_KEY, blockPhone, unblockPhone, type PhoneHistory } from "@/lib/admin-phones";

/**
 * A number's past, next to its order. A buyer who refused two parcels is worth
 * a firmer confirmation call, or no parcel at all, before the third ships.
 */
export function PhoneBadge({ history }: { history: PhoneHistory | undefined }) {
  const { t } = useI18n();
  if (!history) return null;
  if (history.blocked) {
    return (
      <Badge tone="danger">
        <Ban size={12} aria-hidden="true" />
        {t("admin.phones.blocked")}
      </Badge>
    );
  }
  if (history.refused === 0) return null;
  return (
    <Badge tone="warning">
      <ShieldAlert size={12} aria-hidden="true" />
      {t("admin.phones.refused", { refused: history.refused, orders: history.orders })}
    </Badge>
  );
}

export function BlockPhoneButton({
  phone,
  history,
}: {
  phone: string;
  history: PhoneHistory | undefined;
}) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const blocked = history?.blocked ?? false;

  const toggle = useMutation({
    mutationFn: () => (blocked ? unblockPhone(phone) : blockPhone(phone)),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [PHONE_HISTORY_KEY] }),
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Button
      variant="ghost"
      size="sm"
      className="self-start text-on-surface-muted"
      disabled={toggle.isPending}
      onClick={() => {
        if (blocked || window.confirm(t("admin.phones.blockConfirm", { phone }))) toggle.mutate();
      }}
    >
      <Ban size={14} aria-hidden="true" />
      {blocked ? t("admin.phones.unblock") : t("admin.phones.block")}
    </Button>
  );
}
