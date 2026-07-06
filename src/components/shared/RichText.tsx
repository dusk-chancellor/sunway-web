import { renderRichText } from "@/lib/format/richtext";
import { cn } from "@/lib/utils/cn";

/** Renders admin-authored text with the safe Markdown subset (see
 *  renderRichText): bold/italic plus preserved paragraphs and line breaks. */
export function RichText({ text, className }: { text: string; className?: string }) {
  const html = renderRichText(text);
  if (!html) return null;
  return (
    <div
      className={cn(
        "space-y-3 leading-relaxed [&_strong]:font-semibold [&_strong]:text-navy",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
