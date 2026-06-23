import type { Translations } from "@/lib/validation/schemas";

/**
 * Resolves an admin-authored field for the active locale, falling back to the
 * base value when there's no (non-empty) translation. Used for product names,
 * descriptions, category names, banner text and shipping method labels.
 */
export function localized(
  translations: Translations | undefined,
  locale: string,
  field: string,
  fallback: string,
): string {
  const value = translations?.[locale]?.[field];
  return value && value.trim() ? value : fallback;
}
