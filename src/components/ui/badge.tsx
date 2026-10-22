import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n-context";
import type { TranslationKey } from "@/lib/i18n";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "bg-surface-high text-on-surface-muted",
        primary: "bg-primary/12 text-primary",
        positive: "bg-positive/12 text-positive",
        warning: "bg-tertiary/15 text-tertiary",
        danger: "bg-error/12 text-error",
        outline: "border border-outline-hi text-on-surface-muted",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

/**
 * Order status pill.
 *
 * Tone carries meaning: pending is a warning because it is the state that costs
 * money if ignored (an unconfirmed order still holds stock), confirmed reads
 * positive, refused and cancelled read as failures.
 */
const STATUS_TONE: Record<string, VariantProps<typeof badgeVariants>["tone"]> = {
  pending: "warning",
  confirmed: "positive",
  shipped: "primary",
  delivered: "positive",
  refused: "danger",
  cancelled: "danger",
  returned: "danger",
};

const STATUS_KEY: Record<string, TranslationKey> = {
  pending: "status.pending",
  confirmed: "status.confirmed",
  refused: "status.refused",
  shipped: "status.shipped",
  delivered: "status.delivered",
  cancelled: "status.cancelled",
  returned: "status.returned",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const t = useT();
  const key = STATUS_KEY[status];
  return (
    <Badge tone={STATUS_TONE[status] ?? "neutral"} className={className}>
      {key ? t(key) : status}
    </Badge>
  );
}
