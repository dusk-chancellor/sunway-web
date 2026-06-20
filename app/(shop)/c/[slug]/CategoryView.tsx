"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SlidersHorizontal } from "lucide-react";
import { useProducts } from "@/lib/api/hooks/catalog";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ProductCardSkeleton } from "@/components/storefront/ProductCardSkeleton";
import { Breadcrumbs } from "@/components/storefront/Breadcrumbs";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export function CategoryView({ slug, name }: { slug: string; name: string }) {
  const t = useTranslations("category");
  const [sort, setSort] = useState("newest");
  const [minPrice, setMin] = useState("");
  const [maxPrice, setMax] = useState("");
  const [applied, setApplied] = useState<{ min?: number; max?: number }>({});
  const [page, setPage] = useState(1);

  const { data, isLoading } = useProducts({
    category: slug,
    sort,
    minPrice: applied.min,
    maxPrice: applied.max,
    page,
  });

  const apply = () => {
    setApplied({
      min: minPrice ? Number(minPrice) * 100 : undefined,
      max: maxPrice ? Number(maxPrice) * 100 : undefined,
    });
    setPage(1);
  };
  const reset = () => {
    setMin("");
    setMax("");
    setApplied({});
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: name }]} />
      <div className="mt-4 flex flex-col gap-6 md:flex-row">
        {/* Filters */}
        <aside className="w-full shrink-0 md:w-64">
          <div className="rounded-r-lg border border-line bg-white p-4">
            <h2 className="mb-3 flex items-center gap-2 font-display text-navy">
              <SlidersHorizontal className="h-4 w-4" /> {t("filters")}
            </h2>
            <p className="mb-2 text-sm font-medium text-navy">{t("priceRange")}</p>
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <Input name="min" className="w-full" inputMode="numeric" placeholder={t("min")} value={minPrice} onChange={(e) => setMin(e.target.value)} />
              </div>
              <div className="min-w-0 flex-1">
                <Input name="max" className="w-full" inputMode="numeric" placeholder={t("max")} value={maxPrice} onChange={(e) => setMax(e.target.value)} />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={apply}>{t("apply")}</Button>
              <Button size="sm" variant="ghost" onClick={reset}>{t("reset")}</Button>
            </div>
          </div>
        </aside>

        {/* Results */}
        <section className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="font-display text-2xl text-navy">{name}</h1>
            <div className="w-48">
              <Select name="sort" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} aria-label={t("sort")}>
                <option value="newest">{t("sortNewest")}</option>
                <option value="price_asc">{t("sortPriceAsc")}</option>
                <option value="price_desc">{t("sortPriceDesc")}</option>
                <option value="name_asc">{t("sortNameAsc")}</option>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : !data || data.items.length === 0 ? (
            <EmptyState title={t("empty")} action={<Button variant="outline" onClick={reset}>{t("reset")}</Button>} />
          ) : (
            <>
              <p className="mb-3 text-sm text-muted">{t("results", { count: data.total })}</p>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {data.items.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
              {data.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Prev
                  </Button>
                  <span className="text-sm text-muted">{page} / {data.totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
