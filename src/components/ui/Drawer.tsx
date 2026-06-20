"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function Drawer({
  open,
  onClose,
  title,
  children,
  side = "right",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  side?: "right" | "left";
}) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCloseRef.current();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className={cn("fixed inset-0 z-50", !open && "pointer-events-none")} aria-hidden={!open}>
      <div
        className={cn("absolute inset-0 bg-navy/40 transition-opacity", open ? "opacity-100" : "opacity-0")}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "absolute top-0 flex h-full w-full max-w-md flex-col bg-white shadow-brand-2 transition-transform duration-300",
          side === "right" ? "right-0" : "left-0",
          open ? "translate-x-0" : side === "right" ? "translate-x-full" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-base font-display text-navy">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-muted hover:text-navy">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
