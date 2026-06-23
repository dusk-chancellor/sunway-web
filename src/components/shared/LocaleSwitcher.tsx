"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Globe } from "lucide-react";
import { enabledLocales, localeNames, LOCALE_COOKIE } from "@/i18n/config";
import { cn } from "@/lib/utils/cn";

/**
 * Language switcher. Writes the locale cookie and refreshes so the server
 * re-renders with the new message catalog (cookie-based i18n, no URL prefix).
 */
export function LocaleSwitcher({ className }: { className?: string }) {
  const router = useRouter();
  const locale = useLocale();
  const [pending, startTransition] = useTransition();

  function change(next: string) {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <label className={cn("inline-flex items-center gap-1.5 text-sm", className)}>
      <Globe className="h-4 w-4 shrink-0" aria-hidden />
      <span className="sr-only">Language</span>
      <select
        value={locale}
        onChange={(e) => change(e.target.value)}
        disabled={pending}
        className="cursor-pointer bg-transparent pr-1 outline-none"
      >
        {enabledLocales.map((l) => (
          <option key={l} value={l}>
            {localeNames[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
