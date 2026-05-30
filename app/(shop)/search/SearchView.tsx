"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Search as SearchIcon } from "lucide-react";
import { useSearch, useCategories } from "@/lib/api/hooks/catalog";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ProductCardSkeleton } from "@/components/storefront/ProductCardSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import Link from "next/link";

export function SearchView() {
  const t = useTranslations("search");
  const router = useRouter();
  const params = useSearchParams();
  const initial = params.get("q") ?? "";
  const [q, setQ] = useState(initial);
  const { data, isLoading } = useSearch(initial);
  const { data: categories } = useCategories(true);

  useEffect(() => setQ(initial), [initial]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <form onSubmit={submit} role="search" className="relative mx-auto max-w-2xl">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("placeholder")}
          aria-label={t("title")}
          className="h-14 w-full rounded-r-lg border border-line bg-white pl-12 pr-4 text-base shadow-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-navy"
        />
      </form>

      <div className="mt-8">
        {!initial ? (
          <div className="flex flex-col items-center gap-6">
            <EmptyState icon={<SearchIcon className="h-10 w-10" />} title={t("emptyTitle")} hint={t("emptyHint")} />
            {categories && (
              <div className="flex flex-wrap justify-center gap-2">
                {categories.map((c) => (
                  <Link key={c.id} href={`/c/${c.slug}`} className="rounded-full border border-line bg-white px-4 py-1.5 text-sm text-navy hover:border-navy/40">
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : !data || data.items.length === 0 ? (
          <EmptyState title={t("noResultsTitle", { q: initial })} hint={t("noResultsHint")} />
        ) : (
          <>
            <h1 className="mb-4 font-display text-xl text-navy">{t("resultsFor", { q: initial })}</h1>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {data.items.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
