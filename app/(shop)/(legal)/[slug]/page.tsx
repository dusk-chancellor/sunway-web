import { notFound } from "next/navigation";
import type { Metadata } from "next";
import DOMPurify from "isomorphic-dompurify";
import { getPage } from "@/server/store";

const LEGAL_SLUGS = ["about", "contacts", "delivery", "terms", "privacy"];

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = getPage(slug);
  return { title: page?.title ?? "Page" };
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!LEGAL_SLUGS.includes(slug)) notFound();
  const page = getPage(slug);
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
