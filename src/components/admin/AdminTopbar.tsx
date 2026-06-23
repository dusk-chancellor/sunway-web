import type { ReactNode } from "react";
import { LocaleSwitcher } from "@/components/shared/LocaleSwitcher";

export function AdminTopbar({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-display text-navy">{title}</h1>
      <div className="flex items-center gap-3">
        <LocaleSwitcher className="text-navy" />
        {action}
      </div>
    </div>
  );
}
