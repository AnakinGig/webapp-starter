import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";

import { defaultLocale, isLocale } from "./config";

export default getRequestConfig(async () => {
  // 1. Saved preference (cookie) - set by the language switcher.
  const cookieStore = await cookies();
  const saved = cookieStore.get("locale")?.value;
  if (isLocale(saved)) {
    return { locale: saved };
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
    return { locale: browserLocale };
  }

  // 3. Default (English).
  return { locale: defaultLocale };
});
