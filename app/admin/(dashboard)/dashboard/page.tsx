"use client";

import { useTranslations } from "next-intl";
import { useAdminStats } from "@/lib/api/hooks/admin";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { Money } from "@/components/shared/Money";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { OrderStatusBadge } from "@/components/shared/StatusBadge";
import { formatDateTime } from "@/lib/format/date";
import type { OrderStatus } from "@/lib/validation/schemas";

const STATUS_ORDER: OrderStatus[] = ["pending", "confirmed", "in_delivery", "delivered", "cancelled"];

export default function DashboardPage() {
  const t = useTranslations("admin");
  const { data, isLoading } = useAdminStats();

  if (isLoading || !data) {
    return (
      <div className="grid place-items-center py-20">
        <Spinner className="h-6 w-6 text-navy" />
      </div>
    );
  }

  const todayTotal = Object.values(data.ordersTodayByStatus).reduce((a, b) => a + b, 0);
  const revenueEntries = Object.entries(data.revenueMtdByCurrency);

  return (
    <div>
      <AdminTopbar title={t("dashboard")} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-r-lg border border-line bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-muted">{t("revenueMtd")}</p>
          <div className="mt-2 space-y-0.5">
            {revenueEntries.length === 0 ? (
              <p className="text-2xl font-display text-navy">
                <Money minor={0n} currency="UZS" />
              </p>
            ) : (
              revenueEntries.map(([cur, minor]) => (
                <p key={cur} className="text-2xl font-display text-navy">
                  <Money minor={minor} currency={cur} />
                </p>
              ))
            )}
          </div>
        </div>
        <div className="rounded-r-lg border border-line bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-muted">{t("ordersToday")}</p>
          <p className="mt-2 text-2xl font-display text-navy">{todayTotal}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {STATUS_ORDER.filter((s) => data.ordersTodayByStatus[s]).map((s) => (
              <span key={s} className="inline-flex items-center gap-1">
                <OrderStatusBadge status={s} />
                <span className="text-xs text-muted">{data.ordersTodayByStatus[s]}</span>
              </span>
            ))}
            {todayTotal === 0 && <span className="text-sm text-muted">{t("noOrdersToday")}</span>}
          </div>
        </div>
        <div className="rounded-r-lg border border-line bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-muted">{t("smsFailuresShort")}</p>
          <p className="mt-2 text-2xl font-display text-navy">{data.smsFailures.length}</p>
          <p className="mt-1 text-xs text-muted">{t("smsFailuresHint")}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-r-lg border border-line bg-white p-5">
          <h2 className="mb-3 font-display text-navy">{t("lowStock")}</h2>
          {data.lowStock.length === 0 ? (
            <EmptyState title={t("allStocked")} hint={t("allStockedHint")} />
          ) : (
            <ul className="divide-y divide-line/70 text-sm">
              {data.lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2">
                  <span className="text-navy">{p.name}</span>
                  <span className={p.stockQty === 0 ? "font-medium text-bad" : "text-warn"}>{t("stockLeft", { count: p.stockQty })}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-r-lg border border-line bg-white p-5">
          <h2 className="mb-3 font-display text-navy">{t("smsFailures")}</h2>
          {data.smsFailures.length === 0 ? (
            <EmptyState title={t("noFailures")} hint={t("noFailuresHint")} />
          ) : (
            <ul className="divide-y divide-line/70 text-sm">
              {data.smsFailures.map((f, i) => (
                <li key={i} className="py-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-navy">{f.phone}</span>
                    <span className="text-xs text-muted">{formatDateTime(f.at)}</span>
                  </div>
                  <p className="text-xs text-bad">{f.error}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
