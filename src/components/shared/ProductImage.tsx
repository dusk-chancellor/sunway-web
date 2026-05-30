import Image from "next/image";
import { cn } from "@/lib/utils/cn";

/** Shows the product image when present, else a branded striped placeholder. */
export function ProductImage({
  src,
  alt,
  className,
  sizes,
}: {
  src: string | null;
  alt: string;
  className?: string;
  sizes?: string;
}) {
  if (!src) {
    return (
      <div className={cn("ph grid place-items-center", className)} role="img" aria-label={alt}>
        <svg viewBox="0 0 64 64" className="h-10 w-10 opacity-40" aria-hidden>
          <circle cx="32" cy="32" r="9" fill="#2B2FA8" />
        </svg>
      </div>
    );
  }
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image src={src} alt={alt} fill sizes={sizes ?? "(max-width: 768px) 50vw, 25vw"} className="object-cover" />
    </div>
  );
}
