"use client";

import { useTranslations } from "next-intl";
import { Heart } from "lucide-react";
import { useWishlist } from "@/lib/api/hooks/account";
import { ProductCard } from "@/components/storefront/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

export default function WishlistPage() {
  const t = useTranslations("account");
  const { data, isLoading } = useWishlist();

  return (
    <div>
      <h1 className="mb-4 font-display text-xl text-navy">{t("wishlist")}</h1>
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="aspect-square" />)}
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState icon={<Heart className="h-10 w-10" />} title={t("wishlistEmpty")} hint={t("wishlistEmptyHint")} />
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {data.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
