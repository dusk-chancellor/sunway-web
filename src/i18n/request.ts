import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { defaultLocale, enabledLocales, LOCALE_COOKIE, type Locale } from "./config";

// Cookie-based locale selection (no URL-prefix routing — see DECISIONS.md). The
// language switcher writes NEXT_LOCALE; we fall back to the default for guests
// or any unsupported value. next-intl powers every string lookup either way.
export default getRequestConfig(async () => {
  const store = await cookies();
  const requested = store.get(LOCALE_COOKIE)?.value as Locale | undefined;
  const locale = requested && enabledLocales.includes(requested) ? requested : defaultLocale;
  const messages = (await import(`./messages/${locale}.json`)).default;
  return { locale, messages };
});
