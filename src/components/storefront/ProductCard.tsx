"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Heart, ShoppingCart } from "lucide-react";
import { ProductImage } from "@/components/shared/ProductImage";
import { Money } from "@/components/shared/Money";
import { Button } from "@/components/ui/Button";
import { useAddToCart } from "@/lib/cart/useCart";
import { useToggleWishlist, useWishlist } from "@/lib/api/hooks/account";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { Product } from "@/lib/validation/schemas";
import { localized } from "@/lib/i18n/content";
import { cn } from "@/lib/utils/cn";

// NOTE: no star ratings anywhere — reviews/ratings are out of scope per spec.
export function ProductCard({ product }: { product: Product }) {
  const t = useTranslations("product");
  const locale = useLocale();
  const name = localized(product.translations, locale, "name", product.name);
  const add = useAddToCart();
  const { isAuthenticated } = useAuth();
  const toggle = useToggleWishlist();
  const { data: wishlist } = useWishlist(isAuthenticated);
  const saved = wishlist?.some((p) => p.id === product.id) ?? false;
  const outOfStock = product.stockQty <= 0;
  const lowStock = product.stockQty > 0 && product.stockQty < 5;

  return (
    <div className="group flex flex-col overflow-hidden rounded-r-lg border border-line bg-white shadow-brand transition-shadow hover:shadow-brand-2">
      <Link href={`/p/${product.slug}`} className="relative block aspect-square">
        <ProductImage src={product.images.find((i) => i.isPrimary)?.url ?? null} alt={name} fit="contain" className="h-full w-full" />
        {isAuthenticated && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              toggle.mutate({ productId: product.id, on: !saved });
            }}
            aria-label={saved ? t("removedFromWishlist") : t("addedToWishlist")}
            aria-pressed={saved}
            className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-navy shadow-brand backdrop-blur hover:bg-white"
          >
            <Heart className={cn("h-4 w-4", saved && "fill-bad text-bad")} />
          </button>
        )}
        {outOfStock && (
          <span className="absolute left-2 top-2 rounded-full bg-navy/85 px-2.5 py-0.5 text-xs font-medium text-white">
            {t("outOfStock")}
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <p className="text-xs uppercase tracking-wide text-muted">{product.categoryName}</p>
        <Link href={`/p/${product.slug}`} className="line-clamp-2 text-sm font-medium text-navy hover:underline">
          {name}
        </Link>
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div>
            <Money minor={product.priceMinor} currency={product.currency} className="font-display text-lg font-semibold text-navy" />
            {lowStock && <p className="text-xs text-warn">{t("lowStock", { count: product.stockQty })}</p>}
          </div>
          <Button
            size="sm"
            aria-label={t("addToCart")}
            disabled={outOfStock || add.isPending}
            onClick={() => add.mutate({ productId: product.id })}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
