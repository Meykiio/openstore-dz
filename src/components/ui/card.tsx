import { cn } from "@/lib/utils";

/**
 * Surfaces.
 *
 * The reference system keeps chrome flat and lets elevation come from a single
 * shadow step, so a card never competes with the product image it frames.
 */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-[16px] border border-outline bg-surface shadow-sm", className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-b border-outline px-5 py-4",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold", className)} {...props} />;
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-4", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-end gap-3 border-t border-outline px-5 py-4",
        className,
      )}
      {...props}
    />
  );
}
