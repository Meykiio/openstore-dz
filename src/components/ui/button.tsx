import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Pill-shaped primary action, matching the commerce reference system.
 * Every interactive control on the storefront uses the full radius.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-medium " +
    "transition-[background,color,box-shadow,transform] duration-150 ease-out-soft " +
    "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 " +
    "[&_svg]:size-[1.1em] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-on-primary hover:bg-primary/90 shadow-sm",
        outline: "border border-outline-hi bg-transparent text-on-surface hover:bg-surface-mid",
        soft: "bg-surface-high text-on-surface hover:bg-surface-highest",
        ghost: "bg-transparent text-on-surface hover:bg-surface-mid",
        danger: "bg-error text-white hover:bg-error/90",
        link: "bg-transparent text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-6 text-[0.95rem]",
        lg: "h-14 px-9 text-base",
        icon: "size-11 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
