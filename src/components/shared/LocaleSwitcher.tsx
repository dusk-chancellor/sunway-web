"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { ChevronDown, Check } from "lucide-react";
import { enabledLocales, localeNames, localeFlags, LOCALE_COOKIE, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils/cn";

/**
 * Language switcher. Writes the locale cookie and refreshes so the server
 * re-renders with the new message catalog (cookie-based i18n, no URL prefix).
 *
 * Custom listbox (not a native <select>) because option elements can't render
 * flag images across browsers. Each language shows its country flag.
 */
function Flag({ locale, className }: { locale: Locale; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- tiny static SVG in /public
    <img
      src={localeFlags[locale]}
      alt=""
      aria-hidden
      className={cn("h-4 w-6 shrink-0 rounded-[3px] object-cover ring-1 ring-black/10", className)}
    />
  );
}

export function LocaleSwitcher({ className }: { className?: string }) {
  const router = useRouter();
  const locale = useLocale() as Locale;
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function change(next: Locale) {
    setOpen(false);
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <div ref={rootRef} className={cn("relative inline-flex text-sm", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Language"
        className="inline-flex items-center gap-1.5 rounded-r-md px-1.5 py-1 outline-none hover:bg-current/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-current disabled:opacity-60"
      >
        <Flag locale={locale} />
        <span>{localeNames[locale]}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} aria-hidden />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Language"
          className="absolute right-0 top-full z-50 mt-1 min-w-[10rem] overflow-hidden rounded-r-md border border-line bg-white py-1 text-navy shadow-brand-2"
        >
          {enabledLocales.map((l) => (
            <li key={l}>
              <button
                type="button"
                role="option"
                aria-selected={l === locale}
                onClick={() => change(l)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-card"
              >
                <Flag locale={l} />
                <span className="flex-1">{localeNames[l]}</span>
                {l === locale && <Check className="h-4 w-4 shrink-0 text-navy" aria-hidden />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
