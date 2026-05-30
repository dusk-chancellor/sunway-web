// Locales scaffolded for the future; only `en` is enabled at launch.
export const locales = ["en", "ru", "uz"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

// Locales actually shipped to users right now. Flip ru/uz on by adding them here
// once their message catalogs are translated.
export const enabledLocales: Locale[] = ["en"];
