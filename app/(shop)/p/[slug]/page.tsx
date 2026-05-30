import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getProductBySlug, getRelated } from "@/server/store";
import { productSchema } from "@/lib/validation/schemas";
import { z } from "zod";
import { Breadcrumbs } from "@/components/storefront/Breadcrumbs";
import { ProductImage } from "@/components/shared/ProductImage";
import { Money } from "@/components/shared/Money";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ProductActions } from "./ProductActions";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getProductBySlug(slug);
  if (!p) return { title: "Product" };
  return {
    title: p.name,
    description: p.description.slice(0, 150),
    openGraph: { title: p.name, description: p.description.slice(0, 150) },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const raw = getProductBySlug(slug);
  if (!raw) notFound();
  const product = productSchema.parse(raw);
  const related = z.array(productSchema).parse(getRelated(slug, 4));

  // JSON-LD for SEO (no price reproduction concerns — it's our own catalog).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    description: product.description,
    offers: {
      "@type": "Offer",
      priceCurrency: product.currency,
      price: (Number(product.priceMinor) / 100).toFixed(2),
      availability: product.stockQty > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: product.categoryName, href: `/c/${product.categorySlug}` },
          { label: product.name },
        ]}
      />

      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <ProductImage
            src={product.images.find((i) => i.isPrimary)?.url ?? null}
            alt={product.name}
            className="aspect-square w-full rounded-r-lg border border-line"
          />
          <div className="grid grid-cols-4 gap-3">
            {product.images.map((img) => (
              <ProductImage key={img.id} src={img.url} alt={img.alt} className="aspect-square rounded-r-md border border-line" />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-sm uppercase tracking-wide text-muted">{product.categoryName}</p>
          <h1 className="font-display text-3xl text-navy">{product.name}</h1>
          <p className="font-mono text-xs text-muted">SKU: {product.sku}</p>
          <Money minor={product.priceMinor} className="font-display text-3xl font-bold text-navy" />
          <ProductActions product={product} />
          <div className="mt-4 border-t border-line pt-4">
            <h2 className="mb-2 font-display text-lg text-navy">Description</h2>
            <p className="leading-relaxed text-muted">{product.description}</p>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-2xl text-navy">You may also like</h2>
            <Link href={`/c/${product.categorySlug}`} className="text-sm font-medium text-navy hover:underline">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
