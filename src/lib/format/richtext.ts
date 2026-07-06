import DOMPurify from "isomorphic-dompurify";

/**
 * Renders a tiny, safe subset of Markdown used by admin-authored product
 * descriptions: **bold**, *italic*, blank-line paragraphs and single-line
 * breaks. Everything is HTML-escaped first, then only a fixed set of formatting
 * tags is emitted, then sanitized — so raw HTML in the source can never render.
 *
 * This is what lets a description typed as
 *   "Some product description\n\nCharacteristics"
 * keep its paragraph break on the storefront (instead of collapsing to one
 * line), and lets the admin bold text with **…**.
 */
function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(escaped: string): string {
  // Bold first (** or __), then italic (single * or _). Input is already
  // HTML-escaped, so these only ever touch literal asterisks/underscores.
  return escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, "$1<em>$2</em>")
    .replace(/(^|[^_\w])_(?!\s)(.+?)_/g, "$1<em>$2</em>");
}

export function renderRichText(md: string): string {
  const text = (md ?? "").replace(/\r\n/g, "\n").trim();
  if (!text) return "";
  const html = text
    .split(/\n{2,}/) // blank line → new paragraph
    .map((block) => {
      const lines = block.split("\n").map((l) => inline(escapeHtml(l)));
      return `<p>${lines.join("<br/>")}</p>`;
    })
    .join("");
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p", "br", "strong", "em"],
    ALLOWED_ATTR: [],
  });
}
