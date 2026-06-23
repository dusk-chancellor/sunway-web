import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { fetchBanners, fetchCategories, fetchProducts } from "@/lib/api/resources/catalog";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ProductImage } from "@/components/shared/ProductImage";
import { HeroCarousel } from "@/components/storefront/HeroCarousel";
import { localized } from "@/lib/i18n/content";

// SSR: fetch from the Go API on the server so the home page is fully rendered
// for SEO and first paint.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const t = await getTranslations("home");
  const locale = await getLocale();

  const [banners, categories, productList] = await Promise.all([
    fetchBanners(),
    fetchCategories(true),
    fetchProducts({ featured: true }),
  ]);
  const featured = productList.items.slice(0, 8);

  return (
    <div className="mx-auto max-w-7xl px-4">
      {/* Hero carousel (auto-slides when more than one banner is active) */}
      <HeroCarousel banners={banners} />

      {/* Featured categories */}
      <section className="mt-12">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-2xl text-navy">{t("featuredCategories")}</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/c/${c.slug}`}
              className="group flex flex-col items-center gap-3 rounded-r-lg border border-line bg-white p-5 text-center shadow-brand transition hover:shadow-brand-2"
            >
              <ProductImage src={c.imageUrl} alt={localized(c.translations, locale, "name", c.name)} className="h-20 w-20 rounded-full" />
              <span className="text-sm font-medium text-navy group-hover:underline">{localized(c.translations, locale, "name", c.name)}</span>
              <span className="text-xs text-muted">{t("itemCount", { count: c.productCount })}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="mt-14">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-2xl text-navy">{t("featuredProducts")}</h2>
          <Link href="/c/electronics" className="inline-flex items-center gap-1 text-sm font-medium text-navy hover:underline">
            {t("viewAll")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
