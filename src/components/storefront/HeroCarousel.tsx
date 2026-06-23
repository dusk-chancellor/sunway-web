"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { ArrowRight } from "lucide-react";
import { ProductImage } from "@/components/shared/ProductImage";
import { localized } from "@/lib/i18n/content";
import type { Banner } from "@/lib/validation/schemas";

const SLIDE_MS = 5000;

/**
 * Hero banner carousel. With a single banner it's just a static hero; with two
 * or more active banners it auto-advances every 5s and exposes manual dots.
 */
export function HeroCarousel({ banners }: { banners: Banner[] }) {
  const locale = useLocale();
  const slides = banners.filter((b) => b.active);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), SLIDE_MS);
    return () => clearInterval(id);
  }, [slides.length]);

  if (slides.length === 0) return null;
  const safeIndex = index % slides.length;

  return (
    <section className="relative mt-6 overflow-hidden rounded-r-xl border border-line bg-gradient-to-br from-navy to-navy-2 text-white">
      {/* Slides stacked; only the active one is visible (cross-fade). */}
      <div className="relative">
        {slides.map((hero, i) => {
          const title = localized(hero.translations, locale, "title", hero.title);
          const subtitle = localized(hero.translations, locale, "subtitle", hero.subtitle);
          const ctaLabel = localized(hero.translations, locale, "ctaLabel", hero.ctaLabel);
          const cols = hero.imageUrl ? "md:grid-cols-2" : "";
          return (
            <div
              key={hero.id}
              aria-hidden={i !== safeIndex}
              className={
                i === safeIndex
                  ? `grid items-center gap-6 p-8 transition-opacity duration-500 md:p-12 ${cols}`
                  : `pointer-events-none absolute inset-0 grid items-center gap-6 p-8 opacity-0 transition-opacity duration-500 md:p-12 ${cols}`
              }
            >
              <div className="flex flex-col gap-4">
                <span className="w-fit rounded-full bg-yellow px-3 py-1 text-xs font-semibold text-navy">SUNWAY</span>
                <h1 className="font-display text-3xl font-bold leading-tight text-white md:text-5xl">{title}</h1>
                <p className="max-w-md text-white/80">{subtitle}</p>
                <Link
                  href={hero.ctaHref}
                  className="mt-2 inline-flex h-12 w-fit items-center gap-2 rounded-r-md bg-yellow px-6 font-medium text-navy transition hover:bg-yellow-deep"
                >
                  {ctaLabel} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              {hero.imageUrl && (
                <ProductImage src={hero.imageUrl} alt={title} className="aspect-[4/3] rounded-r-lg" sizes="(max-width: 768px) 100vw, 50vw" />
              )}
            </div>
          );
        })}
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Show banner ${i + 1}`}
              aria-current={i === safeIndex}
              onClick={() => setIndex(i)}
              className={
                i === safeIndex
                  ? "h-2 w-6 rounded-full bg-yellow transition-all"
                  : "h-2 w-2 rounded-full bg-white/50 transition-all hover:bg-white/80"
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}
