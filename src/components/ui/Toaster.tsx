"use client";

import { useEffect } from "react";
import { useUI } from "@/stores/ui";
import { cn } from "@/lib/utils/cn";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

export function Toaster() {
  const toasts = useUI((s) => s.toasts);
  const dismiss = useUI((s) => s.dismissToast);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4" role="region" aria-live="polite">
      {toasts.map((t) => (
        <Toast key={t.id} id={t.id} message={t.message} variant={t.variant} onDismiss={dismiss} />
      ))}
    </div>
  );
}

function Toast({
  id,
  message,
  variant,
  onDismiss,
}: {
  id: string;
  message: string;
  variant: "ok" | "bad" | "info";
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(id), 3500);
    return () => clearTimeout(t);
  }, [id, onDismiss]);

  const Icon = variant === "ok" ? CheckCircle2 : variant === "bad" ? XCircle : Info;
  const color = variant === "ok" ? "text-ok" : variant === "bad" ? "text-bad" : "text-navy";

  return (
    <div className={cn("pointer-events-auto flex items-center gap-3 rounded-r-md border border-line bg-white px-4 py-3 shadow-brand-2 max-w-sm")}>
      <Icon className={cn("h-5 w-5 shrink-0", color)} aria-hidden />
      <p className="text-sm text-navy">{message}</p>
      <button onClick={() => onDismiss(id)} aria-label="Dismiss" className="ml-auto text-muted hover:text-navy">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
