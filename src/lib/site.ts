import { appSettings } from "./app"

/**
 * Compatibility alias — edit values in `src/lib/app.ts` instead.
 */
export const siteConfig = appSettings

export type SiteConfig = typeof appSettings
