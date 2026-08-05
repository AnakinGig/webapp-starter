export type CookieConsent = {
  /** Always true - the auth session cookie + this consent cookie are required. */
  essential: boolean
  analytics: boolean
  marketing: boolean
}

/** Choices that the user can actually toggle. */
export type CookieConsentChoices = Pick<CookieConsent, "analytics" | "marketing">

export const COOKIE_NAME = "cookie-consent"
const CONSENT_VERSION = "v1"
const MAX_AGE_SECONDS = 365 * 24 * 60 * 60 // 1 year

export const COOKIE_PREFERENCES_EVENT = "open-cookie-preferences"

function parseConsent(value: string | undefined): CookieConsent | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as {
      v?: string
      analytics?: boolean
      marketing?: boolean
    }
    if (parsed?.v === CONSENT_VERSION) {
      return {
        essential: true,
        analytics: Boolean(parsed.analytics),
        marketing: Boolean(parsed.marketing),
      }
    }
  } catch {
    // Malformed or outdated value - treat as no consent.
  }
  return null
}

/** Read the stored consent (null = user hasn't decided yet). Client only. */
export function readConsent(): CookieConsent | null {
  if (typeof document === "undefined") return null
  const cookies = document.cookie.split("; ")
  const entry = cookies.find((c) => c.startsWith(`${COOKIE_NAME}=`))
  if (!entry) return null
  return parseConsent(entry.slice(COOKIE_NAME.length + 1))
}

/** Persist the user's choice. The consent cookie itself is strictly necessary. */
export function writeConsent(choices: CookieConsentChoices) {
  if (typeof document === "undefined") return
  const value = encodeURIComponent(
    JSON.stringify({ v: CONSENT_VERSION, ...choices }),
  )
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; secure"
      : ""
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${MAX_AGE_SECONDS}; samesite=lax${secure}`
}
