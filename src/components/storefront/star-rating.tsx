import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Star rating.
 *
 * Filled or dim, rounded to the nearest whole star, matching the reference's
 * `.stars` markup. Announced as a single labelled image — a screen reader should
 * hear "4 out of 5", not five separate graphics.
 */
export function StarRating({
  value,
  size = "sm",
  className,
  label,
}: {
  value: number;
  size?: "sm" | "lg";
  className?: string;
  label?: string;
}) {
  const filled = Math.round(value);
  return (
    <span
      className={cn("stars", size === "lg" && "lg", className)}
      role="img"
      aria-label={label ?? `${value.toFixed(1)} / 5`}
    >
      {[1, 2, 3, 4, 5].map((index) => (
        <Star
          key={index}
          className={index <= filled ? undefined : "dim"}
          fill={index <= filled ? "currentColor" : "none"}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

/**
 * Rating input. A radio group, so arrow keys and screen readers work with no
 * JavaScript at all.
 */
export function StarRatingInput({
  value,
  onChange,
  name,
  label,
}: {
  value: number;
  onChange: (next: number) => void;
  name: string;
  label: string;
}) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="text-sm font-medium">{label}</legend>
      <div className="flex items-center gap-1" dir="ltr">
        {[1, 2, 3, 4, 5].map((index) => (
          <label
            key={index}
            className="cursor-pointer rounded p-0.5 transition-transform hover:scale-110"
          >
            <input
              type="radio"
              name={name}
              value={index}
              checked={value === index}
              onChange={() => onChange(index)}
              className="peer sr-only"
            />
            <Star
              size={26}
              aria-hidden="true"
              className={cn(
                "text-outline-hi transition-colors",
                index <= value && "fill-tertiary text-tertiary",
                "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary",
              )}
            />
            <span className="sr-only">{index}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
