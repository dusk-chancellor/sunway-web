"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAdminOrders } from "@/lib/api/hooks/admin";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { Input } from "@/components/ui/Input";
import { Money } from "@/components/shared/Money";
import { Spinner } from "@/components/ui/Spinner";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/shared/StatusBadge";
import { formatDate } from "@/lib/format/date";
import { cn } from "@/lib/utils/cn";
import type { Order } from "@/lib/validation/schemas";

const FILTER_VALUES = ["", "pending", "confirmed", "in_delivery", "delivered", "cancelled"] as const;

export default function AdminOrdersPage() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const ts = useTranslations("status");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const { data, isLoading } = useAdminOrders(status || undefined, search.trim() || undefined);

  const columns: Column<Order>[] = [
    {
      key: "number",
      header: t("colOrder"),
      render: (o) => (
        <Link href={`/admin/orders/${o.number}`} className="font-mono font-medium text-navy hover:underline">
          {o.number}
        </Link>
      ),
    },
    { key: "date", header: t("date"), render: (o) => <span className="text-muted">{formatDate(o.createdAt)}</span> },
    { key: "customer", header: t("shipTo"), render: (o) => <span className="text-navy">{o.customerName || o.shippingAddress.fullName || "—"}</span> },
    { key: "total", header: t("total"), render: (o) => <Money minor={o.totalMinor} currency={o.currency} /> },
    { key: "status", header: t("status"), render: (o) => <OrderStatusBadge status={o.status} /> },
    { key: "payment", header: t("payment"), render: (o) => <PaymentStatusBadge status={o.paymentStatus} /> },
  ];

  return (
    <div>
      <AdminTopbar title={t("orders")} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTER_VALUES.map((value) => (
            <button
              key={value || "all"}
              onClick={() => setStatus(value)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm",
                status === value ? "bg-navy text-white" : "bg-card text-navy hover:bg-line",
              )}
            >
              {value === "" ? tc("all") : ts(value)}
            </button>
          ))}
        </div>
        <div className="ml-auto w-full max-w-xs">
          <Input placeholder={t("searchOrders")} value={search} onChange={(e) => setSearch(e.target.value)} aria-label={t("searchOrders")} />
        </div>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-20"><Spinner className="h-6 w-6 text-navy" /></div>
      ) : (
        <AdminTable columns={columns} rows={data?.items ?? []} rowKey={(o) => o.id} empty={t("noOrdersFilter")} />
      )}
    </div>
  );
}
