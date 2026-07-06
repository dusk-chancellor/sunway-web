"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { Bold } from "lucide-react";

/**
 * Textarea with a small Bold button (wraps the selection in **…**) and a hint.
 * The storefront renders the same Markdown subset via RichText, so **bold** and
 * blank-line paragraphs come out formatted.
 */
export function MarkdownTextarea({
  id,
  value,
  onChange,
  rows = 3,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  const t = useTranslations("admin");
  const ref = useRef<HTMLTextAreaElement>(null);

  const wrapBold = () => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const selected = value.slice(start, end) || t("boldPlaceholder");
    onChange(value.slice(0, start) + "**" + selected + "**" + value.slice(end));
    // Reselect the wrapped text so the admin can keep typing/toggling.
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + 2, start + 2 + selected.length);
    });
  };

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={wrapBold}
          className="inline-flex items-center gap-1 rounded-r-md border border-line px-2 py-1 text-xs font-medium text-navy hover:bg-card"
          aria-label={t("bold")}
        >
          <Bold className="h-3.5 w-3.5" /> {t("bold")}
        </button>
        <span className="text-xs text-muted">{t("markdownHint")}</span>
      </div>
      <textarea
        id={id}
        ref={ref}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-r-md border border-line bg-white px-3 py-2 text-sm text-navy outline-none focus-visible:ring-2 focus-visible:ring-navy/40"
      />
    </div>
  );
}
