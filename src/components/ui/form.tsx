import { createContext, useContext, useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Form controls.
 *
 * Built on native `input`, `textarea` and `select` — a native select is the
 * correct control on Algerian mobile traffic because it opens the OS picker. The
 * visual comes from the reference system's `.form-*` classes rather than ad-hoc
 * utilities, so every field in the storefront and the dashboard matches.
 *
 * `Field` owns the id/aria wiring between label, hint, control and error, so a
 * caller cannot forget it.
 */

type FieldContextValue = {
  controlId: string;
  errorId: string;
  helpfulId: string;
  invalid: boolean;
};

const FieldContext = createContext<FieldContextValue | null>(null);

function useFieldWiring(fallbackId: string) {
  const ctx = useContext(FieldContext);
  if (!ctx) {
    return { id: fallbackId, "aria-invalid": undefined, "aria-describedby": undefined };
  }
  return {
    id: ctx.controlId,
    "aria-invalid": ctx.invalid || undefined,
    "aria-describedby": [ctx.helpfulId, ctx.errorId].filter(Boolean).join(" ") || undefined,
  };
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  const wiring = useFieldWiring(useId());
  return <input className={cn("form-input", className)} {...wiring} {...props} />;
}

export function Textarea({
  className,
  rows = 4,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const wiring = useFieldWiring(useId());
  return <textarea rows={rows} className={cn("form-textarea", className)} {...wiring} {...props} />;
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const wiring = useFieldWiring(useId());
  return (
    <select className={cn("form-select", className)} {...wiring} {...props}>
      {children}
    </select>
  );
}

/** A labelled, described field. Wraps exactly one control. */
export function Field({
  label,
  hint,
  error,
  required,
  className,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const controlId = useId();
  const errorId = `${controlId}-error`;
  const helpfulId = hint ? `${controlId}-hint` : "";

  return (
    <FieldContext.Provider value={{ controlId, errorId, helpfulId, invalid: Boolean(error) }}>
      <div className={cn("form-group", className)}>
        <label htmlFor={controlId}>
          {label}
          {required && (
            <span className="text-error" aria-hidden="true">
              {" *"}
            </span>
          )}
        </label>
        {hint && (
          <p
            id={helpfulId}
            className="-mt-0.5 text-xs normal-case tracking-normal text-on-surface-muted"
          >
            {hint}
          </p>
        )}
        {children}
        {error && (
          <p id={errorId} className="text-xs font-medium text-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </FieldContext.Provider>
  );
}

/**
 * Switch built on a native checkbox. `role="switch"` plus `aria-checked` is what
 * a screen reader needs; the visual is a peer-checked track, moved with
 * `inset-inline-start` so it is correct in RTL without a direction override.
 */
export function Switch({
  label,
  className,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <label
        htmlFor={id}
        className="text-sm font-medium normal-case tracking-normal text-on-surface"
      >
        {label}
      </label>
      <input id={id} type="checkbox" role="switch" className="peer sr-only" {...props} />
      <span
        aria-hidden="true"
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full bg-surface-highest transition-colors duration-150",
          "after:absolute after:top-0.5 after:start-0.5 after:size-5 after:rounded-full",
          "after:bg-surface after:transition-[inset-inline-start] after:duration-150",
          "peer-checked:bg-primary peer-checked:after:start-[1.375rem]",
          "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary",
        )}
        onClick={() => document.getElementById(id)?.click()}
      />
    </div>
  );
}
