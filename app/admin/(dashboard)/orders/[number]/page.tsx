"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { useAdminOrder, useChangeOrderStatus, useMarkPaid } from "@/lib/api/hooks/admin";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Money } from "@/components/shared/Money";
import { Spinner } from "@/components/ui/Spinner";
import { ProductImage } from "@/components/shared/ProductImage";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/shared/StatusBadge";
import { formatDateTime } from "@/lib/format/date";
import type { OrderStatus, PaymentMethod } from "@/lib/validation/schemas";

// The sales manager can move an order to any status at any point.
const ALL_STATUSES: OrderStatus[] = ["pending", "confirmed", "in_delivery", "delivered", "cancelled"];

// Checkout owns the method labels; this maps a stored method onto its key.
function paymentLabelKey(method: PaymentMethod): "payCod" | "payClick" | "payNasiya" | "payPayme" {
  switch (method) {
    case "cod":
      return "payCod";
    case "click":
      return "payClick";
    case "uzum_nasiya":
      return "payNasiya";
    default:
      return "payPayme";
  }
}

export default function AdminOrderDetailPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = use(params);
  const t = useTranslations("admin");
  const tcart = useTranslations("cart");
  const tco = useTranslations("checkout");
  const tn = useTranslations("nasiya");
  const ts = useTranslations("status");
  const { data: order, isLoading } = useAdminOrder(number);
  const changeStatus = useChangeOrderStatus();
  const markPaid = useMarkPaid();

  const [nextStatus, setNextStatus] = useState<OrderStatus | "">("");
  const [note, setNote] = useState("");

  if (isLoading || !order) {
    return <div className="grid place-items-center py-20"><Spinner className="h-6 w-6 text-navy" /></div>;
  }

  const allowed = ALL_STATUSES.filter((s) => s !== order.status);
  const orderNumber = order.number;

  function applyStatus() {
    if (!nextStatus) return;
    changeStatus.mutate(
      { number: orderNumber, status: nextStatus, note: note.trim() },
      {
        onSuccess: () => {
          setNextStatus("");
          setNote("");
        },
      },
    );
  }

  return (
    <div>
      <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-navy">
        <ArrowLeft className="h-4 w-4" /> {t("backToOrders")}
      </Link>
      <AdminTopbar title={`${t("order")} ${order.number}`} action={<OrderStatusBadge status={order.status} />} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-r-lg border border-line bg-white p-5">
            <h2 className="mb-3 font-display text-navy">{t("items")}</h2>
            <ul className="divide-y divide-line/70">
              {order.items.map((it) => (
                <li key={it.id} className="flex items-center gap-3 py-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-r-md">
                    <ProductImage src={it.imageUrl} alt={it.productName} sizes="56px" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-navy">{it.productName}</p>
                    <p className="text-xs text-muted">
                      <Money minor={it.unitPriceMinor} currency={order.currency} /> × {it.quantity}
                    </p>
                  </div>
                  <Money minor={it.lineTotalMinor} currency={order.currency} className="text-sm text-navy" />
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted">{tcart("subtotal")}</dt><dd><Money minor={order.subtotalMinor} currency={order.currency} /></dd></div>
              {/* Only historical orders carry a shipping charge — the delivery
                  fee is collected in cash by the courier now. */}
              {order.shippingMinor > 0n && (
                <div className="flex justify-between"><dt className="text-muted">{tcart("shipping")} ({order.shippingMethodName})</dt><dd><Money minor={order.shippingMinor} currency={order.currency} /></dd></div>
              )}
              <div className="flex justify-between font-display text-base text-navy"><dt>{tcart("total")}</dt><dd><Money minor={order.totalMinor} currency={order.currency} /></dd></div>
            </dl>
          </section>

          <section className="rounded-r-lg border border-line bg-white p-5">
            <h2 className="mb-3 font-display text-navy">{t("timeline")}</h2>
            <ol className="space-y-3">
              {order.timeline.map((node) => (
                <li key={node.status} className="flex gap-3">
                  <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${node.reachedAt ? "bg-ok" : "bg-line"}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <OrderStatusBadge status={node.status} />
                      {node.reachedAt && <span className="text-xs text-muted">{formatDateTime(node.reachedAt)}</span>}
                    </div>
                    {node.note && <p className="mt-0.5 text-sm text-muted">{node.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-r-lg border border-line bg-white p-5">
            <h2 className="mb-3 font-display text-navy">{t("payment")}</h2>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">{tco(paymentLabelKey(order.paymentMethod))}</span>
              <PaymentStatusBadge status={order.paymentStatus} />
            </div>
            {order.paymentStatus !== "paid" && order.paymentStatus !== "refunded" && (
              <Button
                size="sm"
                variant="outline"
                className="mt-3 w-full"
                onClick={() => markPaid.mutate(order.number)}
                disabled={markPaid.isPending}
              >
                {markPaid.isPending ? t("saving") : t("markPaymentSuccess")}
              </Button>
            )}

            {/* The installment contract. `isSigned` means the customer signed in
                Uzum's WebView — the order is only paid once the contract is
                active, which is what the payment status above reflects. */}
            {order.nasiya && (
              <dl className="mt-4 space-y-1.5 border-t border-line pt-3 text-sm">
                <div className="flex justify-between gap-2"><dt className="text-muted">{tn("state")}</dt><dd className="text-navy">{order.nasiya.state}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-muted">{tn("plan")}</dt><dd className="text-navy">{order.nasiya.tariff}</dd></div>
                {order.nasiya.monthlyMinor !== null && (
                  <div className="flex justify-between gap-2"><dt className="text-muted">{tn("perMonth")}</dt><dd><Money minor={order.nasiya.monthlyMinor} currency={order.currency} /></dd></div>
                )}
                {order.nasiya.totalMinor !== null && (
                  <div className="flex justify-between gap-2"><dt className="text-muted">{tn("totalWithMarkup")}</dt><dd><Money minor={order.nasiya.totalMinor} currency={order.currency} /></dd></div>
                )}
                <div className="flex justify-between gap-2"><dt className="text-muted">{tn("weReceive")}</dt><dd><Money minor={order.nasiya.originMinor} currency={order.currency} /></dd></div>
                {order.nasiya.contractId !== null && (
                  <div className="flex justify-between gap-2"><dt className="text-muted">{tn("contractNumber")}</dt><dd className="font-mono text-navy">{order.nasiya.contractId}</dd></div>
                )}
                {order.nasiya.providerRef !== null && (
                  <div className="flex justify-between gap-2"><dt className="text-muted">{tn("providerRef")}</dt><dd className="font-mono text-navy">{order.nasiya.providerRef}</dd></div>
                )}
                <div className="flex justify-between gap-2"><dt className="text-muted">{tn("signed")}</dt><dd className="text-navy">{order.nasiya.isSigned ? "✓" : "—"}</dd></div>
                {order.nasiya.customerName && (
                  <div className="flex justify-between gap-2"><dt className="text-muted">{tn("borrower")}</dt><dd className="text-navy">{order.nasiya.customerName}</dd></div>
                )}
                {order.nasiya.actPdf && (
                  <a href={order.nasiya.actPdf} target="_blank" rel="noreferrer" className="block pt-1 font-medium text-navy hover:underline">{tn("openAct")}</a>
                )}
              </dl>
            )}
          </section>

          <section className="rounded-r-lg border border-line bg-white p-5">
            <h2 className="mb-3 font-display text-navy">{t("customer")}</h2>
            <div className="space-y-0.5 text-sm text-navy">
              <p className="font-medium">{order.customerName || order.shippingAddress.fullName || "—"}</p>
              <p className="text-muted">{order.phone || "—"}</p>
            </div>
          </section>

          <section className="rounded-r-lg border border-line bg-white p-5">
            <h2 className="mb-3 font-display text-navy">{t("shipTo")}</h2>
            <address className="space-y-0.5 text-sm not-italic text-navy">
              <p className="font-medium">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.street}{order.shippingAddress.apartment ? `, ${order.shippingAddress.apartment}` : ""}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.region}</p>
              <p>{order.shippingAddress.country}{order.shippingAddress.postalCode ? `, ${order.shippingAddress.postalCode}` : ""}</p>
            </address>
          </section>

          {allowed.length > 0 && (
            <section className="rounded-r-lg border border-line bg-white p-5">
              <h2 className="mb-3 font-display text-navy">{t("updateStatus")}</h2>
              <Select
                label={t("newStatus")}
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value as OrderStatus)}
              >
                <option value="">{t("selectDots")}</option>
                {allowed.map((s) => (
                  <option key={s} value={s}>{ts(s)}</option>
                ))}
              </Select>
              <div className="mt-3">
                <label htmlFor="status-note" className="mb-1.5 block text-sm font-medium text-navy">{t("noteOptional")}</label>
                <textarea
                  id="status-note"
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-r-md border border-line bg-white px-3 py-2 text-sm text-navy outline-none focus-visible:ring-2 focus-visible:ring-navy/40"
                  placeholder={t("notePlaceholder")}
                />
              </div>
              <Button
                size="sm"
                className="mt-3 w-full"
                onClick={applyStatus}
                disabled={!nextStatus || changeStatus.isPending}
              >
                {changeStatus.isPending ? t("updating") : t("apply")}
              </Button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
