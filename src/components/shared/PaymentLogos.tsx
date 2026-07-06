/**
 * Brand marks for the online payment providers. The image files live in the
 * Next.js public/ folder and are served from the site root:
 *   sunway-web/public/payme.png  ->  /payme.png
 *   sunway-web/public/click.png  ->  /click.png
 *
 * Height is driven by the caller's className (e.g. `h-6 w-auto`); width follows
 * the image's own aspect ratio. Use a transparent-background PNG (roughly 2×
 * the display height, e.g. ~48px tall, for a crisp result on retina screens).
 */

/* eslint-disable @next/next/no-img-element -- small static brand logos; the Next
   image optimizer isn't needed and would complicate fixed-height/auto-width. */

export function PaymeLogo({ className }: { className?: string }) {
  return <img src="/payme.png" alt="Payme" className={className} />;
}

export function ClickLogo({ className }: { className?: string }) {
  return <img src="/click.png" alt="Click" className={className} />;
}
