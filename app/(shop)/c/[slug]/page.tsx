import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { fetchCategories } from "@/lib/api/resources/catalog";
import type { Category } from "@/lib/validation/schemas";
import { localized } from "@/lib/i18n/content";
import { CategoryView } from "./CategoryView";

async function getCategory(slug: string): Promise<Category | null> {
  try {
    const cats = await fetchCategories();
    return cats.find((c) => c.slug === slug) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const cat = await getCategory(slug);
  if (!cat) return { title: "Category" };
  return { title: cat.name, description: `Shop ${cat.name} at Sunway.` };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cat = await getCategory(slug);
  if (!cat) notFound();
  const locale = await getLocale();
  return <CategoryView slug={cat.slug} name={localized(cat.translations, locale, "name", cat.name)} />;
}
