import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";

import { defaultLocale, isLocale, type Locale } from "./config";

/**
 * Resolve the locale for the current request, then load its message catalog.
 * Order: saved preference (locale cookie) > browser locale > English.
 * Returning `messages` here is what makes both server-side getTranslations and
 * the client-side NextIntlClientProvider work - without it next-intl reports
 * "No messages were configured" / "No messages found".
 */
async function resolveLocale(): Promise<Locale> {
  // 1. Saved preference (cookie) - set by the language switcher.
  const cookieStore = await cookies();
  const saved = cookieStore.get("locale")?.value;
  if (isLocale(saved)) {
    return saved;
  }

  // 2. Browser locale - for visitors without a saved preference. Only accept
  //    the language part (e.g. "fr-FR" -> "fr"); unsupported locales fall
  //    through to the default below.
  const headerStore = await headers();
  const acceptLanguage = headerStore.get("accept-language") ?? "";
  const browserLocale = acceptLanguage
    .split(",")[0]
    ?.split("-")[0]
    ?.trim()
    .toLowerCase();
  if (isLocale(browserLocale)) {
    return browserLocale;
  }

  // 3. Default (English).
  return defaultLocale;
}

export default getRequestConfig(async () => {
  const locale = await resolveLocale();
  // The dynamic import is typed `any` by TS (template-literal path), which the
  // project's type-checked ESLint rules flag - cast through a typed shape.
  const catalog = (await import(`../../messages/${locale}.json`)) as {
    default: Record<string, unknown>;
  };
  return {
    locale,
    messages: catalog.default,
  };
});
