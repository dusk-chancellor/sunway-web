"use client";

import { useState } from "react";
import Link from "next/link";
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

const FILTERS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_delivery", label: "In delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AdminOrdersPage() {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const { data, isLoading } = useAdminOrders(status || undefined, search.trim() || undefined);

  const columns: Column<Order>[] = [
    {
      key: "number",
      header: "Order",
      render: (o) => (
        <Link href={`/admin/orders/${o.number}`} className="font-mono font-medium text-navy hover:underline">
          {o.number}
        </Link>
      ),
    },
    { key: "date", header: "Date", render: (o) => <span className="text-muted">{formatDate(o.createdAt)}</span> },
    { key: "customer", header: "Ship to", render: (o) => <span className="text-navy">{o.shippingAddress.fullName}</span> },
    { key: "total", header: "Total", render: (o) => <Money minor={o.totalMinor} currency={o.currency} /> },
    { key: "status", header: "Status", render: (o) => <OrderStatusBadge status={o.status} /> },
    { key: "payment", header: "Payment", render: (o) => <PaymentStatusBadge status={o.paymentStatus} /> },
  ];

  return (
    <div>
      <AdminTopbar title="Orders" />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.value || "all"}
              onClick={() => setStatus(f.value)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm",
                status === f.value ? "bg-navy text-white" : "bg-card text-navy hover:bg-line",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="ml-auto w-full max-w-xs">
          <Input placeholder="Search by order # or phone…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search orders" />
        </div>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-20"><Spinner className="h-6 w-6 text-navy" /></div>
      ) : (
        <AdminTable columns={columns} rows={data?.items ?? []} rowKey={(o) => o.id} empty="No orders match this filter." />
      )}
    </div>
  );
}
