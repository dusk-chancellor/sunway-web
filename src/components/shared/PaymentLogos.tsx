"use client";

import { useState } from "react";

/**
 * Brand marks for the online payment providers. The image files live in the
 * Next.js public/ folder and are served from the site root:
 *   sunway-web/public/payme.png        ->  /payme.png
 *   sunway-web/public/click.png        ->  /click.png
 *   sunway-web/public/uzum-nasiya.png  ->  /uzum-nasiya.png
 *
 * Height is driven by the caller's className (e.g. `h-6 w-auto`); width follows
 * the image's own aspect ratio. Use a transparent-background PNG (roughly 2×
 * the display height, e.g. ~48px tall, for a crisp result on retina screens).
 *
 * A missing file falls back to a plain wordmark rather than a broken-image
 * icon, so a payment method is never unpickable just because its logo hasn't
 * been dropped in yet.
 */

/* eslint-disable @next/next/no-img-element -- small static brand logos; the Next
   image optimizer isn't needed and would complicate fixed-height/auto-width. */

function BrandMark({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <span className="text-sm font-semibold text-navy">{alt}</span>;
  }
  // max-w-full keeps a wide lockup (all three are ~3:1) inside its tile on
  // narrow screens instead of spilling past the border.
  return (
    <img
      src={src}
      alt={alt}
      className={`max-w-full object-contain ${className ?? ""}`}
      onError={() => setFailed(true)}
    />
  );
}

export function PaymeLogo({ className }: { className?: string }) {
  return <BrandMark src="/payme.png" alt="Payme" className={className} />;
}

export function ClickLogo({ className }: { className?: string }) {
  return <BrandMark src="/click.png" alt="Click" className={className} />;
}

export function UzumNasiyaLogo({ className }: { className?: string }) {
  return <BrandMark src="/uzum-nasiya.png" alt="Uzum Nasiya" className={className} />;
}
