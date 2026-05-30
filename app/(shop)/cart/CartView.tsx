"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ShoppingCart } from "lucide-react";
import { useCart, useUpdateCartItem, useRemoveCartItem } from "@/lib/cart/useCart";
import { ProductImage } from "@/components/shared/ProductImage";
import { Money } from "@/components/shared/Money";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

export function CartView() {
  const t = useTranslations("cart");
  const { data: cart, isLoading } = useCart();
  const update = useUpdateCartItem();
  const remove = useRemoveCartItem();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-6 h-40 w-full" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <EmptyState
          icon={<ShoppingCart className="h-10 w-10" />}
          title={t("empty")}
          hint={t("emptyHint")}
          action={<Link href="/" className="inline-flex h-11 items-center rounded-r-md bg-navy px-6 text-sm font-medium text-white hover:bg-navy-2">Browse catalog</Link>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 font-display text-2xl text-navy">{t("title")}</h1>
      <div className="grid gap-8 lg:grid-cols-3">
        <ul className="divide-y divide-line lg:col-span-2">
          {cart.items.map((item) => (
            <li key={item.id} className="flex gap-4 py-5">
              <ProductImage src={item.imageUrl} alt={item.name} className="h-24 w-24 shrink-0 rounded-r-md border border-line" />
              <div className="flex flex-1 flex-col">
                <Link href={`/p/${item.slug}`} className="font-medium text-navy hover:underline">{item.name}</Link>
                <span className="mt-1 text-sm text-muted">{t("unitPrice")}: <Money minor={item.unitPriceMinor} /></span>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <QuantityStepper value={item.quantity} max={item.stockQty} onChange={(v) => update.mutate({ id: item.id, quantity: v })} />
                  <button onClick={() => remove.mutate(item.id)} className="text-sm text-bad hover:underline">{t("remove")}</button>
                </div>
              </div>
              <div className="text-right">
                <Money minor={item.lineTotalMinor} className="font-display font-semibold text-navy" />
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-r-lg border border-line bg-white p-5 shadow-brand">
          <h2 className="mb-4 font-display text-lg text-navy">{t("title")}</h2>
          <div className="flex items-center justify-between border-b border-line pb-3 text-sm">
            <span className="text-muted">{t("subtotal")}</span>
            <Money minor={cart.subtotalMinor} className="font-medium text-navy" />
          </div>
          <div className="flex items-center justify-between py-3 text-sm">
            <span className="text-muted">{t("shipping")}</span>
            <span className="text-muted">{t("shippingAtCheckout")}</span>
          </div>
          <Link href="/checkout" className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-r-md bg-navy text-sm font-medium text-white hover:bg-navy-2">
            {t("checkout")}
          </Link>
        </aside>
      </div>
    </div>
  );
}
