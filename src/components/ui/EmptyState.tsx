import { type ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon?: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-r-lg border border-dashed border-line bg-card/40 px-6 py-16 text-center">
      {icon && <div className="text-muted" aria-hidden>{icon}</div>}
      <h3 className="text-lg font-display text-navy">{title}</h3>
      {hint && <p className="max-w-sm text-sm text-muted">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
