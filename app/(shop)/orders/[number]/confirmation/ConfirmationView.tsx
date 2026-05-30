"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { useOrder } from "@/lib/api/hooks/account";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Money } from "@/components/shared/Money";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/shared/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate } from "@/lib/format/date";

export function ConfirmationView({ number }: { number: string }) {
  const t = useTranslations("confirmation");
  const { user } = useAuth();
  const { data: order, isLoading } = useOrder(number);

  if (isLoading) return <div className="mx-auto max-w-3xl px-4 py-12"><Skeleton className="h-64 w-full" /></div>;
  if (!order) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex flex-col items-center gap-3 text-center">
        <CheckCircle2 className="h-16 w-16 text-ok" />
        <h1 className="font-display text-2xl text-navy">{t("title")}</h1>
        <p className="text-muted">{t("subtitle", { phone: user?.phone ?? "" })}</p>
      </div>

      <div className="mt-8 rounded-r-lg border border-line bg-white p-6 shadow-brand">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <p className="text-xs uppercase text-muted">{t("orderNumber")}</p>
            <p className="font-mono text-lg font-semibold text-navy">{order.number}</p>
          </div>
          <div className="flex gap-2">
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-4 py-4 text-sm">
          <div><dt className="text-muted">{t("orderDate")}</dt><dd className="text-navy">{formatDate(order.createdAt)}</dd></div>
          {order.estimatedDelivery && (
            <div><dt className="text-muted">{t("estDelivery")}</dt><dd className="text-navy">{formatDate(order.estimatedDelivery)}</dd></div>
          )}
          <div className="col-span-2">
            <dt className="text-muted">{t("shippTo")}</dt>
            <dd className="text-navy">{order.shippingAddress.fullName} — {order.shippingAddress.street}, {order.shippingAddress.city}</dd>
          </div>
        </dl>

        <ul className="divide-y divide-line border-t border-line">
          {order.items.map((it) => (
            <li key={it.id} className="flex items-center justify-between py-3 text-sm">
              <span className="text-navy">{it.quantity}× {it.productName}</span>
              <Money minor={it.lineTotalMinor} className="text-navy" />
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1 border-t border-line pt-4 text-sm">
          <div className="flex justify-between"><span className="text-muted">Subtotal</span><Money minor={order.subtotalMinor} className="text-navy" /></div>
          <div className="flex justify-between"><span className="text-muted">Shipping ({order.shippingMethodName})</span><Money minor={order.shippingMinor} className="text-navy" /></div>
          <div className="flex justify-between text-base font-semibold"><span className="text-navy">Total</span><Money minor={order.totalMinor} className="text-navy" /></div>
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-3">
        <Link href="/" className="inline-flex h-11 items-center rounded-r-md border border-line bg-white px-6 text-sm font-medium text-navy hover:border-navy/40">{t("continueShopping")}</Link>
        <Link href="/account/orders" className="inline-flex h-11 items-center rounded-r-md bg-navy px-6 text-sm font-medium text-white hover:bg-navy-2">{t("viewAllOrders")}</Link>
      </div>
    </div>
  );
}
