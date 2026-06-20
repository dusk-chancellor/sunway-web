"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Package } from "lucide-react";
import { useOrders, useCancelOrder } from "@/lib/api/hooks/account";
import { Money } from "@/components/shared/Money";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate } from "@/lib/format/date";
import { cn } from "@/lib/utils/cn";

type Tab = "all" | "active" | "completed" | "cancelled";

export default function OrdersPage() {
  const t = useTranslations("orders");
  const [tab, setTab] = useState<Tab>("all");
  const { data, isLoading } = useOrders();
  const cancel = useCancelOrder();

  const tabs: Tab[] = ["all", "active", "completed", "cancelled"];
  const filtered = data?.items.filter((o) => {
    if (tab === "all") return true;
    if (tab === "active") return ["pending", "confirmed", "in_delivery"].includes(o.status);
    if (tab === "completed") return o.status === "delivered";
    return o.status === "cancelled";
  });

  return (
    <div>
      <h1 className="mb-4 font-display text-xl text-navy">{t("title")}</h1>
      <div className="mb-6 flex gap-1 border-b border-line">
        {tabs.map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={cn(
              "border-b-2 px-4 py-2 text-sm font-medium",
              tab === tb ? "border-navy text-navy" : "border-transparent text-muted hover:text-navy",
            )}
          >
            {t(tb === "all" ? "tabAll" : tb === "active" ? "tabActive" : tb === "completed" ? "tabCompleted" : "tabCancelled")}
            {data && ` (${data.counts[tb]})`}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : !filtered || filtered.length === 0 ? (
        <EmptyState icon={<Package className="h-10 w-10" />} title={t("empty")} hint={t("emptyHint")} />
      ) : (
        <ul className="space-y-4">
          {filtered.map((o) => (
            <li key={o.id} className="rounded-r-lg border border-line bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
                <div>
                  <Link href={`/orders/${o.number}/confirmation`} className="font-mono font-semibold text-navy hover:underline">{o.number}</Link>
                  <p className="text-xs text-muted">{formatDate(o.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex flex-col items-end gap-1">
                    <span className="text-[10px] uppercase tracking-wide text-muted">{t("orderStatusLabel")}</span>
                    <OrderStatusBadge status={o.status} />
                  </span>
                  <span className="flex flex-col items-end gap-1">
                    <span className="text-[10px] uppercase tracking-wide text-muted">{t("paymentStatusLabel")}</span>
                    <PaymentStatusBadge status={o.paymentStatus} />
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3">
                <p className="text-sm text-muted">{o.items.length} {t("items")}</p>
                <div className="flex items-center gap-4">
                  <Money minor={o.totalMinor} currency={o.currency} className="font-display font-semibold text-navy" />
                  {o.status === "pending" && (
                    <Button size="sm" variant="outline" onClick={() => cancel.mutate(o.number)} disabled={cancel.isPending}>
                      {t("cancel")}
                    </Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
