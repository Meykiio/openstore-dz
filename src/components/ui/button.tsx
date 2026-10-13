import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Pill action, using the `.btn` classes ported from the reference system.
 *
 * The shape, weight and hover lift come from the design system rather than from
 * ad-hoc utilities, so every button on the storefront — storefront, cart,
 * checkout, dashboard — moves identically. `secondary` is the 2px-outline style,
 * not a filled grey, because the reference reserves a filled second colour for
 * the berry "sale" action.
 */
const buttonVariants = cva("btn", {
  variants: {
    variant: {
      primary: "btn-primary",
      secondary: "btn-secondary",
      // `outline` is an alias for `secondary`, kept because the storefront and
      // dashboard call sites read better as "outline" for a neutral bordered
      // action. It is the same 2px-outline style, not a second visual.
      outline: "btn-secondary",
      ghost: "btn-ghost",
      berry: "btn-berry",
      danger: "btn-danger",
      link: "!p-0 !h-auto bg-transparent text-primary underline-offset-4 hover:underline",
    },
    size: {
      sm: "btn-sm",
      md: "",
      lg: "btn-lg",
      icon: "btn-icon",
    },
  },
  defaultVariants: { variant: "primary", size: "md" },
});

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
