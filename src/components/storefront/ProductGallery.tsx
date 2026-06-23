"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import type { ProductImage as ProductImageT } from "@/lib/validation/schemas";
import { cn } from "@/lib/utils/cn";

/**
 * Product image gallery: a large main image, a thumbnail strip that swaps it,
 * and a full-screen lightbox (click the main image) you can slide through with
 * arrows or the keyboard. Renders nothing when there are no images — no holder.
 */
export function ProductGallery({ images, alt }: { images: ProductImageT[]; alt: string }) {
  const pics = images.filter((i): i is ProductImageT & { url: string } => Boolean(i.url));
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);

  const count = pics.length;
  const go = useCallback((d: number) => setActive((i) => (i + d + count) % count), [count]);

  // Keyboard nav while the lightbox is open.
  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(false);
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom, go]);

  if (count === 0) return null;
  const current = pics[Math.min(active, count - 1)]!;
  // Uploaded images are proxied from the backend; skip the Next optimizer.
  const noOpt = (u: string) => u.startsWith("/uploads/");

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setZoom(true)}
        className="group relative aspect-square w-full cursor-zoom-in overflow-hidden rounded-r-lg border border-line"
        aria-label="Zoom image"
      >
        <Image src={current.url} alt={current.alt || alt} fill sizes="(max-width: 768px) 100vw, 50vw" unoptimized={noOpt(current.url)} className="object-cover" />
        <span className="absolute bottom-2 right-2 grid h-9 w-9 place-items-center rounded-full bg-navy/70 text-white opacity-0 transition group-hover:opacity-100">
          <ZoomIn className="h-4 w-4" />
        </span>
      </button>

      {count > 1 && (
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
          {pics.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={i === active}
              className={cn(
                "relative aspect-square overflow-hidden rounded-r-md border transition",
                i === active ? "border-navy ring-2 ring-navy/40" : "border-line hover:border-navy/40",
              )}
            >
              <Image src={img.url} alt={img.alt || alt} fill sizes="100px" unoptimized={noOpt(img.url)} className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {zoom && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/90 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setZoom(false)}
        >
          <button
            type="button"
            onClick={() => setZoom(false)}
            aria-label="Close"
            className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>

          {count > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); go(-1); }}
              aria-label="Previous image"
              className="absolute left-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          <div className="relative h-[80vh] w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <Image src={current.url} alt={current.alt || alt} fill sizes="100vw" unoptimized={noOpt(current.url)} className="object-contain" />
          </div>

          {count > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); go(1); }}
              aria-label="Next image"
              className="absolute right-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {count > 1 && (
            <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
              {pics.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setActive(i); }}
                  aria-label={`Go to image ${i + 1}`}
                  className={cn("h-2 rounded-full transition-all", i === active ? "w-6 bg-yellow" : "w-2 bg-white/50 hover:bg-white/80")}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
