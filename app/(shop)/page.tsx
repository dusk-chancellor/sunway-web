import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { fetchBanners, fetchCategories, fetchProducts } from "@/lib/api/resources/catalog";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ProductImage } from "@/components/shared/ProductImage";

// SSR: fetch from the Go API on the server so the home page is fully rendered
// for SEO and first paint.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const t = await getTranslations("home");

  const [banners, categories, productList] = await Promise.all([
    fetchBanners(),
    fetchCategories(true),
    fetchProducts({ featured: true }),
  ]);
  const featured = productList.items.slice(0, 8);
  const hero = banners[0];

  return (
    <div className="mx-auto max-w-7xl px-4">
      {/* Hero */}
      {hero && (
        <section className="mt-6 overflow-hidden rounded-r-xl border border-line bg-gradient-to-br from-navy to-navy-2 text-white">
          <div className="grid items-center gap-6 p-8 md:grid-cols-2 md:p-12">
            <div className="flex flex-col gap-4">
              <span className="w-fit rounded-full bg-yellow px-3 py-1 text-xs font-semibold text-navy">SUNWAY</span>
              <h1 className="font-display text-3xl font-bold leading-tight text-white md:text-5xl">{hero.title}</h1>
              <p className="max-w-md text-white/80">{hero.subtitle}</p>
              <Link
                href={hero.ctaHref}
                className="mt-2 inline-flex h-12 w-fit items-center gap-2 rounded-r-md bg-yellow px-6 font-medium text-navy transition hover:bg-yellow-deep"
              >
                {hero.ctaLabel} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="ph aspect-[4/3] rounded-r-lg" role="img" aria-label={hero.title} />
          </div>
        </section>
      )}

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
              <ProductImage src={c.imageUrl} alt={c.name} className="h-20 w-20 rounded-full" />
              <span className="text-sm font-medium text-navy group-hover:underline">{c.name}</span>
              <span className="text-xs text-muted">{c.productCount} items</span>
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
