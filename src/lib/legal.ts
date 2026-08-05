/**
 * Legal placeholders for the boilerplate. Replace every `[bracket]` value
 * with your real details, then re-run `pnpm check`. The legal pages under
 * `/legal/*` render this config — you shouldn't need to touch the pages
 * themselves for a basic fill-in.
 */
export const legalInfo = {
  companyName: "[Your Company]",
  legalEntity: "[Your Legal Entity, e.g. Your Company Ltd.]",
  serviceName: "[Your Service Name]",
  email: "legal@example.com",
  address: "[Registered address]",
  jurisdiction: "[Your country/state]",
  /** Bump this whenever you change the policy pages. */
  lastUpdated: "August 5, 2026",
}

export type LegalInfo = typeof legalInfo
