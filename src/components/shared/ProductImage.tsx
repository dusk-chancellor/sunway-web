import Image from "next/image";
import { cn } from "@/lib/utils/cn";

/** Shows the product image when present. When there's no image, renders nothing
 *  (no placeholder holder) — callers decide how empty space should look. */
export function ProductImage({
  src,
  alt,
  className,
  sizes,
  fit = "cover",
}: {
  src: string | null;
  alt: string;
  className?: string;
  sizes?: string;
  /** "cover" fills the holder (crops); "contain" shrinks the whole picture to
   *  fit inside it (letterboxes). Use "contain" where the full product photo
   *  must always be visible (product cards/gallery). */
  fit?: "cover" | "contain";
}) {
  if (!src) return null;
  // Admin-uploaded files are served (proxied) from the backend under /uploads/*
  // and are already re-encoded to sane sizes — skip the Next optimizer for them
  // so a proxied path can't surface as a broken/"not found" optimized image.
  const unoptimized = src.startsWith("/uploads/");
  return (
    <div className={cn("relative overflow-hidden", fit === "contain" && "bg-white", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes ?? "(max-width: 768px) 50vw, 25vw"}
        unoptimized={unoptimized}
        className={fit === "contain" ? "object-contain" : "object-cover"}
      />
    </div>
  );
}
