import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n-context";

/**
 * Modal built on the native `<dialog>` element.
 *
 * `showModal()` gives focus trapping, inertness of the page behind, Esc to
 * close and correct `::backdrop` painting for free. Reimplementing those with a
 * div and a `keydown` listener is the usual source of a dialog that leaks focus
 * back to the page underneath.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const t = useT();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      // `onClose` also fires when Esc closes it, so state never drifts from DOM.
      onClose={onClose}
      onClick={(event) => {
        // Only a click on the backdrop itself reaches the dialog element.
        if (event.target === ref.current) onClose();
      }}
      aria-labelledby="dialog-title"
      className={cn(
        "m-auto w-[min(92vw,44rem)] max-h-[85dvh] overflow-hidden rounded-[16px] border border-outline",
        "bg-surface p-0 text-on-surface shadow-lg backdrop:bg-black/45 backdrop:backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 border-b border-outline px-5 py-4">
        <div className="min-w-0">
          <h2 id="dialog-title" className="text-lg font-semibold">
            {title}
          </h2>
          {description && <p className="mt-1 text-sm text-on-surface-muted">{description}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("common.close")}
          className="-me-1 -mt-1 inline-flex size-9 shrink-0 items-center justify-center rounded-full text-on-surface-muted transition-colors hover:bg-surface-mid"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="max-h-[calc(85dvh-9rem)] overflow-y-auto px-5 py-4">{children}</div>

      {footer && (
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-outline bg-surface-mid px-5 py-4">
          {footer}
        </div>
      )}
    </dialog>
  );
}
