"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { useOrder } from "@/lib/api/hooks/account";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Money } from "@/components/shared/Money";
import { PaymeLogo, ClickLogo, UzumNasiyaLogo } from "@/components/shared/PaymentLogos";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/shared/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate } from "@/lib/format/date";
import { retryOrderPayment } from "@/lib/api/resources/orders";
import { useSyncPayment } from "@/lib/api/hooks/nasiya";
import { isOnlineMethod, type OnlinePaymentMethod } from "@/lib/validation/schemas";
import { useUI } from "@/stores/ui";

export function ConfirmationView({ number }: { number: string }) {
  const t = useTranslations("confirmation");
  const tc = useTranslations("cart");
  const tn = useTranslations("nasiya");
  const { user } = useAuth();
  const { data: order, isLoading, refetch, isRefetching } = useOrder(number);
  const pushToast = useUI((s) => s.pushToast);
  const [paying, setPaying] = useState<null | OnlinePaymentMethod>(null);
  const sync = useSyncPayment(number);
  const synced = useRef(false);

  // This page is also where the provider returns the customer to. That return
  // is unauthenticated, unsigned and proves nothing on its own — so on arrival
  // we ask the backend to re-read the payment from its gateway. For Uzum Nasiya
  // that call is what confirms a signed contract and marks the order paid.
  const unsettled =
    Boolean(order) &&
    isOnlineMethod(order!.paymentMethod) &&
    order!.paymentStatus !== "paid" &&
    order!.paymentStatus !== "refunded";
  useEffect(() => {
    if (!synced.current && unsettled) {
      synced.current = true;
      sync.mutate();
    }
  }, [unsettled, sync]);

  if (isLoading) return <div className="mx-auto max-w-3xl px-4 py-12"><Skeleton className="h-64 w-full" /></div>;
  if (!order) return null;

  // An online order that's placed but not yet paid (the customer abandoned, a
  // card was declined, or an installment contract is still unsigned) can be
  // retried — a fresh redirect is issued on click. Installments resume the
  // existing contract when one is still open.
  const needsPayment =
    order.status === "pending" &&
    isOnlineMethod(order.paymentMethod) &&
    order.paymentStatus !== "paid" &&
    order.paymentStatus !== "refunded";
  const isNasiya = order.paymentMethod === "uzum_nasiya";

  const pay = async (method: OnlinePaymentMethod) => {
    setPaying(method);
    try {
      const { paymentRedirectUrl } = await retryOrderPayment(
        order.number,
        method,
        method === "uzum_nasiya" ? order.nasiya?.tariff : undefined,
      );
      if (paymentRedirectUrl) {
        window.location.href = paymentRedirectUrl;
        return; // keep the spinner up while the browser navigates away
      }
      pushToast(t("retryError"), "bad");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : t("retryError"), "bad");
    } finally {
      setPaying(null);
    }
  };

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
            <span className="flex flex-col items-end gap-1">
              <span className="text-[10px] uppercase tracking-wide text-muted">{t("orderStatusLabel")}</span>
              <OrderStatusBadge status={order.status} />
            </span>
            <span className="flex flex-col items-end gap-1">
              <span className="text-[10px] uppercase tracking-wide text-muted">{t("paymentStatusLabel")}</span>
              <PaymentStatusBadge status={order.paymentStatus} />
            </span>
          </div>
        </div>

        {needsPayment && (
          <div className="mt-4 rounded-r-md border border-warn/40 bg-warn-soft/50 p-4">
            <p className="font-medium text-navy">{t("paymentPending")}</p>
            <p className="mt-1 text-sm text-muted">{t("paymentPendingHint")}</p>
            {/* Switching an installment order to a card (or the reverse) would
                mean abandoning a credit contract mid-flight, so the retry keeps
                the customer on the method they chose. */}
            {isNasiya ? (
              <button
                type="button"
                onClick={() => pay("uzum_nasiya")}
                disabled={paying !== null}
                aria-label={t("payWith", { provider: "Uzum Nasiya" })}
                className="mt-3 flex w-full items-center justify-center rounded-r-md border border-line bg-white p-3 transition hover:border-navy/40 disabled:opacity-60"
              >
                <UzumNasiyaLogo className="h-6 w-auto" />
              </button>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => pay("payme")}
                  disabled={paying !== null}
                  aria-label={t("payWith", { provider: "Payme" })}
                  className="flex items-center justify-center rounded-r-md border border-line bg-white p-3 transition hover:border-navy/40 disabled:opacity-60"
                >
                  <PaymeLogo className="h-6 w-auto" />
                </button>
                <button
                  type="button"
                  onClick={() => pay("click")}
                  disabled={paying !== null}
                  aria-label={t("payWith", { provider: "Click" })}
                  className="flex items-center justify-center rounded-r-md border border-line bg-white p-3 transition hover:border-navy/40 disabled:opacity-60"
                >
                  <ClickLogo className="h-6 w-auto" />
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => sync.mutate(undefined, { onSettled: () => refetch() })}
              disabled={isRefetching || sync.isPending}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-navy hover:underline disabled:opacity-60"
            >
              <RefreshCw className={isRefetching || sync.isPending ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} /> {t("checkAgain")}
            </button>
          </div>
        )}

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
              <Money minor={it.lineTotalMinor} currency={order.currency} className="text-navy" />
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1 border-t border-line pt-4 text-sm">
          <div className="flex justify-between"><span className="text-muted">{tc("subtotal")}</span><Money minor={order.subtotalMinor} currency={order.currency} className="text-navy" /></div>
          {/* Only historical orders carry a shipping charge; the fee is paid in
              cash to the courier now. */}
          {order.shippingMinor > 0n && (
            <div className="flex justify-between"><span className="text-muted">{tc("shipping")} ({order.shippingMethodName})</span><Money minor={order.shippingMinor} currency={order.currency} className="text-navy" /></div>
          )}
          <div className="flex justify-between text-base font-semibold"><span className="text-navy">{tc("total")}</span><Money minor={order.totalMinor} currency={order.currency} className="text-navy" /></div>
        </div>

        {order.nasiya && (
          <div className="mt-4 rounded-r-md border border-line bg-card p-4 text-sm">
            <p className="font-medium text-navy">{tn("contractTitle")}</p>
            <dl className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <dt className="text-muted">{tn("plan")}</dt>
                <dd className="text-navy">{tn("months", { count: order.nasiya.periodMonths })}</dd>
              </div>
              {order.nasiya.monthlyMinor !== null && (
                <div>
                  <dt className="text-muted">{tn("perMonth")}</dt>
                  <dd className="text-navy"><Money minor={order.nasiya.monthlyMinor} currency={order.currency} /></dd>
                </div>
              )}
              {order.nasiya.totalMinor !== null && (
                <div>
                  <dt className="text-muted">{tn("totalWithMarkup")}</dt>
                  <dd className="text-navy"><Money minor={order.nasiya.totalMinor} currency={order.currency} /></dd>
                </div>
              )}
              {order.nasiya.contractId !== null && (
                <div>
                  <dt className="text-muted">{tn("contractNumber")}</dt>
                  <dd className="font-mono text-navy">{order.nasiya.contractId}</dd>
                </div>
              )}
            </dl>
            {order.nasiya.actPdf && (
              <a href={order.nasiya.actPdf} target="_blank" rel="noreferrer" className="mt-3 inline-block font-medium text-navy hover:underline">
                {tn("openAct")}
              </a>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-center gap-3">
        <Link href="/" className="inline-flex h-11 items-center rounded-r-md border border-line bg-white px-6 text-sm font-medium text-navy hover:border-navy/40">{t("continueShopping")}</Link>
        <Link href="/account/orders" className="inline-flex h-11 items-center rounded-r-md bg-navy px-6 text-sm font-medium text-white hover:bg-navy-2">{t("viewAllOrders")}</Link>
      </div>
    </div>
  );
}
