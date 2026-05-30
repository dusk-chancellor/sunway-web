"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ShoppingCart } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Money } from "@/components/shared/Money";
import { ProductImage } from "@/components/shared/ProductImage";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { EmptyState } from "@/components/ui/EmptyState";
import { useUI } from "@/stores/ui";
import { useCart, useUpdateCartItem, useRemoveCartItem } from "@/lib/cart/useCart";

export function CartDrawer() {
  const t = useTranslations("cart");
  const open = useUI((s) => s.cartDrawerOpen);
  const close = useUI((s) => s.closeCart);
  const { data: cart } = useCart();
  const update = useUpdateCartItem();
  const remove = useRemoveCartItem();

  return (
    <Drawer open={open} onClose={close} title={t("title")}>
      {!cart || cart.items.length === 0 ? (
        <div className="p-5">
          <EmptyState icon={<ShoppingCart className="h-10 w-10" />} title={t("empty")} hint={t("emptyHint")} />
        </div>
      ) : (
        <div className="flex h-full flex-col">
          <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
            {cart.items.map((item) => (
              <li key={item.id} className="flex gap-3 py-4">
                <ProductImage src={item.imageUrl} alt={item.name} className="h-20 w-20 shrink-0 rounded-r-md" />
                <div className="flex flex-1 flex-col gap-1">
                  <Link href={`/p/${item.slug}`} onClick={close} className="line-clamp-2 text-sm font-medium text-navy hover:underline">
                    {item.name}
                  </Link>
                  <Money minor={item.unitPriceMinor} className="text-sm text-muted" />
                  <div className="mt-auto flex items-center justify-between">
                    <QuantityStepper
                      value={item.quantity}
                      max={item.stockQty}
                      onChange={(v) => update.mutate({ id: item.id, quantity: v })}
                    />
                    <button onClick={() => remove.mutate(item.id)} className="text-xs text-bad hover:underline">
                      {t("remove")}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="border-t border-line p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-muted">{t("subtotal")}</span>
              <Money minor={cart.subtotalMinor} className="font-display text-lg font-semibold text-navy" />
            </div>
            <Link
              href="/checkout"
              onClick={close}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-r-md bg-navy px-5 text-sm font-medium font-display text-white transition-colors hover:bg-navy-2"
            >
              {t("checkout")}
            </Link>
          </div>
        </div>
      )}
    </Drawer>
  );
}
