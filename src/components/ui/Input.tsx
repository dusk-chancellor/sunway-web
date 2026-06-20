import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, id, className, ...props },
  ref,
) {
  const inputId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-navy">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        className={cn(
          // w-full + min-w-0 so inputs shrink inside flex rows instead of
          // overflowing their container (e.g. the price-range Min/Max filters).
          "h-11 w-full min-w-0 rounded-r-md border bg-white px-3.5 text-sm text-navy placeholder:text-muted/60",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-navy focus-visible:outline-offset-1",
          error ? "border-bad" : "border-line",
          className,
        )}
        {...props}
      />
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-bad" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});
