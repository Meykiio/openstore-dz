import { AlertTriangle, Inbox, Loader2, PackageOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n-context";

export function Spinner({ className, size = 18 }: { className?: string; size?: number }) {
  return <Loader2 size={size} className={cn("animate-spin", className)} aria-hidden="true" />;
}

/** Full-region loading state. Announced politely, not as an alert. */
export function LoadingState({ className, label }: { className?: string; label?: string }) {
  const t = useT();
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16 text-on-surface-muted",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Spinner size={24} />
      <p className="text-sm">{label ?? t("common.loading")}</p>
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
  icon,
  className,
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-[16px] border border-dashed border-outline px-6 py-14 text-center",
        className,
      )}
    >
      <span className="text-on-surface-muted" aria-hidden="true">
        {icon ?? <Inbox size={28} />}
      </span>
      <p className="font-medium">{title}</p>
      {body && <p className="max-w-sm text-sm text-on-surface-muted">{body}</p>}
      {action}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  className,
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  const t = useT();
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-3 rounded-[16px] border border-error/40 bg-error/5 px-5 py-4 text-sm",
        className,
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} className="mt-0.5 shrink-0 text-error" aria-hidden="true" />
        <p className="text-on-surface">{message ?? t("common.somethingWrong")}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {t("common.retry")}
        </button>
      )}
    </div>
  );
}

/** Catalogue-shaped placeholder so the grid does not jump on load. */
export function ProductSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3", className)} aria-hidden="true">
      <div className="aspect-[4/5] animate-pulse rounded-[16px] bg-surface-high" />
      <div className="h-4 w-3/4 animate-pulse rounded bg-surface-high" />
      <div className="h-4 w-1/3 animate-pulse rounded bg-surface-high" />
    </div>
  );
}

export function NoProducts() {
  const t = useT();
  return (
    <EmptyState
      title={t("store.empty.title")}
      body={t("store.empty.body")}
      icon={<PackageOpen size={28} />}
    />
  );
}
