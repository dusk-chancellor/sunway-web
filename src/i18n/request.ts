import { getRequestConfig } from "next-intl/server";
import { defaultLocale } from "./config";

// Single-locale setup (no URL-prefix routing yet — see DECISIONS.md).
// next-intl still powers all string lookups so adding ru/uz later is a
// content change, not a refactor.
export default getRequestConfig(async () => {
  const locale = defaultLocale;
  const messages = (await import(`./messages/${locale}.json`)).default;
  return { locale, messages };
});
