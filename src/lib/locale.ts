import { defaultLocale, isLocale } from "@/i18n/config";

/**
 * Locale cookie helpers. The `locale` cookie stores the visitor's language
 * choice (contract: contracts/feature-toggles.md); the i18n request config
 * (`src/i18n/request.ts`) resolves: saved cookie > browser locale > English.
 */

const LOCALE_COOKIE = "locale";

/** Read the saved locale, or the default when unset/invalid. */
export function getLocaleCookie(): string {
  if (typeof document === "undefined") return defaultLocale;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${LOCALE_COOKIE}=`));
  const value = match?.split("=")[1];
  return isLocale(value) ? value : defaultLocale;
}

/** Persist the locale choice in a cookie (1 year). */
export function setLocaleCookie(locale: string) {
  document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(locale)}; path=/; max-age=31536000; samesite=lax`;
}
