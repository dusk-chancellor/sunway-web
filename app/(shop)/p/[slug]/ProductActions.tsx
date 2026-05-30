"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { Badge } from "@/components/ui/Badge";
import { useAddToCart } from "@/lib/cart/useCart";
import { useToggleWishlist, useWishlist } from "@/lib/api/hooks/account";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useUI } from "@/stores/ui";
import type { Product } from "@/lib/validation/schemas";
import { cn } from "@/lib/utils/cn";

export function ProductActions({ product }: { product: Product }) {
  const t = useTranslations("product");
  const [qty, setQty] = useState(1);
  const add = useAddToCart();
  const openCart = useUI((s) => s.openCart);
  const { isAuthenticated } = useAuth();
  const toggle = useToggleWishlist();
  const { data: wishlist } = useWishlist(isAuthenticated);
  const saved = wishlist?.some((p) => p.id === product.id) ?? false;

  const out = product.stockQty <= 0;
  const low = product.stockQty > 0 && product.stockQty < 5;

  return (
    <div className="flex flex-col gap-4">
      <div>
        {out ? (
          <Badge tone="bad">{t("outOfStock")}</Badge>
        ) : low ? (
          <Badge tone="warn">{t("lowStock", { count: product.stockQty })}</Badge>
        ) : (
          <Badge tone="ok">{t("inStock")}</Badge>
        )}
      </div>
      {!out && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted">{t("quantity")}</span>
          <QuantityStepper value={qty} max={product.stockQty} onChange={setQty} />
        </div>
      )}
      <div className="flex gap-3">
        <Button
          size="lg"
          disabled={out || add.isPending}
          onClick={() => add.mutate({ productId: product.id, quantity: qty }, { onSuccess: () => openCart() })}
        >
          <ShoppingCart className="h-5 w-5" /> {t("addToCart")}
        </Button>
        {isAuthenticated && (
          <Button
            variant="outline"
            size="lg"
            aria-pressed={saved}
            onClick={() => toggle.mutate({ productId: product.id, on: !saved })}
          >
            <Heart className={cn("h-5 w-5", saved && "fill-bad text-bad")} />
          </Button>
        )}
      </div>
    </div>
  );
}
