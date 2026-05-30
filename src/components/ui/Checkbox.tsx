import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, id, className, ...props },
  ref,
) {
  const inputId = id ?? props.name;
  return (
    <label htmlFor={inputId} className="inline-flex cursor-pointer items-center gap-2 text-sm text-navy">
      <input
        ref={ref}
        id={inputId}
        type="checkbox"
        className={cn("h-4 w-4 rounded border-line text-navy accent-navy", className)}
        {...props}
      />
      {label}
    </label>
  );
});
