// Supported locales.
export const locales = ["en", "ru", "uz"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

// Locales actually shipped to users. en/ru/uz are all translated and selectable
// via the in-app language switcher (cookie-based; see i18n/request.ts).
export const enabledLocales: Locale[] = ["en", "ru", "uz"];

// Cookie that carries the chosen locale across requests (no URL-prefix routing).
export const LOCALE_COOKIE = "NEXT_LOCALE";

// Human-facing labels for the switcher.
export const localeNames: Record<Locale, string> = {
  en: "English",
  ru: "Русский",
  uz: "O‘zbek",
};
