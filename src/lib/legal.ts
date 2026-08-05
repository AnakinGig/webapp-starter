import { appSettings } from "./app"

/**
 * Legal placeholders for the boilerplate — derived from `src/lib/app.ts`,
 * so update the company/contact values there instead of here. The `/legal/*`
 * pages render these.
 */
export const legalInfo = {
  companyName: appSettings.company.legalEntity,
  legalEntity: appSettings.company.legalEntity,
  serviceName: appSettings.name,
  email: appSettings.contactEmail,
  address: appSettings.company.address,
  jurisdiction: appSettings.company.jurisdiction,
  /** Bump this whenever you change the policy pages. */
  lastUpdated: appSettings.legalLastUpdated,
}

export type LegalInfo = typeof legalInfo
