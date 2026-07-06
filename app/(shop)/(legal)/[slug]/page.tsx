import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import DOMPurify from "isomorphic-dompurify";
import { fetchPage } from "@/lib/api/resources/catalog";
import type { StaticPage } from "@/lib/validation/schemas";

const LEGAL_SLUGS = ["about", "contacts", "delivery", "terms", "privacy"];

async function getLegalPage(slug: string, locale: string): Promise<StaticPage | null> {
  try {
    return await fetchPage(slug, locale);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const page = await getLegalPage(slug, locale);
  return { title: page?.title ?? "Page" };
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!LEGAL_SLUGS.includes(slug)) notFound();
  const locale = await getLocale();
  const page = await getLegalPage(slug, locale);
  if (!page) notFound();

  // Editorial HTML is sanitized before rendering (only place we use
  // dangerouslySetInnerHTML, per spec).
  const clean = DOMPurify.sanitize(page.html);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <article
        className="prose-sunway [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-navy [&_h2]:mb-4 [&_p]:text-muted [&_p]:leading-relaxed [&_p]:mb-4"
        dangerouslySetInnerHTML={{ __html: clean }}
      />
    </div>
  );
}
