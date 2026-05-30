import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
}

const variants: Record<Variant, string> = {
  primary: "bg-navy text-white hover:bg-navy-2 disabled:opacity-50",
  outline: "border border-line bg-white text-navy hover:border-navy/40 disabled:opacity-50",
  ghost: "bg-transparent text-navy hover:bg-card disabled:opacity-50",
  danger: "bg-bad text-white hover:opacity-90 disabled:opacity-50",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", block, className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-r-md font-medium font-display transition-colors",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-navy focus-visible:outline-offset-2",
        "disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        block && "w-full",
        className,
      )}
      {...props}
    />
  );
});
