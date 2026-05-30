"use client";

import Link from "next/link";
import { useCategories } from "@/lib/api/hooks/catalog";

export function CategoryNav() {
  const { data: categories } = useCategories();
  if (!categories?.length) return null;
  return (
    <div className="border-b border-line bg-white">
      <nav className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-2 text-sm">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/c/${c.slug}`}
            className="whitespace-nowrap rounded-r-sm px-3 py-1.5 text-muted hover:bg-card hover:text-navy"
          >
            {c.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}
