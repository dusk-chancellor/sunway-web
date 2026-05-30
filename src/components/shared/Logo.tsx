import Link from "next/link";
import { cn } from "@/lib/utils/cn";

/** Sunway sunburst mark + wordmark, lifted from the homepage mockup. */
export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5", className)} aria-label="Sunway home">
      <svg viewBox="0 0 64 64" className="h-8 w-8" role="img" aria-hidden>
        <circle cx="32" cy="32" r="9" fill="#2B2FA8" />
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * Math.PI) / 4;
          const x1 = 32 + Math.cos(angle) * 15;
          const y1 = 32 + Math.sin(angle) * 15;
          const x2 = 32 + Math.cos(angle) * 24;
          const y2 = 32 + Math.sin(angle) * 24;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FFD400" strokeWidth="4" strokeLinecap="round" />;
        })}
      </svg>
      <span className="font-display text-xl font-bold tracking-tight text-navy">SUNWAY</span>
    </Link>
  );
}
