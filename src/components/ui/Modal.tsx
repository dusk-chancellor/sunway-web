"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Keep onClose in a ref so the effect below only depends on `open`. Otherwise
  // a new onClose identity on every parent render re-runs the effect and calls
  // ref.current.focus() on each keystroke — stealing focus from inner inputs.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        tabIndex={-1}
        className={cn("relative z-10 w-full max-w-lg rounded-r-lg bg-white p-6 shadow-brand-2 outline-none", className)}
      >
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-display text-navy">{title}</h2>
            <button onClick={onClose} aria-label="Close" className="text-muted hover:text-navy">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
