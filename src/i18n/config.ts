/**
 * Shared i18n configuration - pure constants, safe to import from both
 * server and client code (no next-intl/server imports here).
 */

/** Locales the app ships with (English is the base/fallback). */
export const locales = ["en", "fr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export function isLocale(value: string | undefined): value is Locale {
  return value === "en" || value === "fr";
}
