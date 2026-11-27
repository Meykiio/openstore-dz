import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./button";
import { Dialog } from "./dialog";
import { useT } from "@/lib/i18n-context";

/**
 * Confirmation for something that cannot be undone.
 *
 * The caller mounts it only while an item is selected, and `onClose` is called
 * once it is finished, so the parent unmounts it by clearing that selection.
 *
 * Both buttons are dead while the work runs: a second tap on a slow phone
 * cannot fire the same delete twice, and the dialog cannot be dismissed
 * half-way through a request it has already sent.
 */
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  /** The work itself. The dialog closes when this settles, either way. */
  onConfirm: () => Promise<unknown>;
  /** Unmount this dialog: after the work settles, or on Esc, backdrop or Cancel. */
  onClose: () => void;
}) {
  const t = useT();
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onConfirm();
    } catch {
      // The caller's mutation already reports the failure, and a dialog that
      // stayed up would hide the message behind its own backdrop.
    } finally {
      setBusy(false);
      onClose();
    }
  };

  return (
    <Dialog
      open
      onClose={busy ? () => {} : onClose}
      title={title}
      className="w-[min(92vw,26rem)]"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            {t("common.cancel")}
          </Button>
          <Button variant="danger" onClick={() => void run()} disabled={busy}>
            {confirmLabel ?? t("common.delete")}
          </Button>
        </>
      }
    >
      <p className="flex items-start gap-3 text-sm">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-error" aria-hidden="true" />
        {message}
      </p>
    </Dialog>
  );
}
