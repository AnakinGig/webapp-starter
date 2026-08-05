"use client"

import { COOKIE_PREFERENCES_EVENT } from "@/lib/consent"

export function CookieSettingsLink() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent(COOKIE_PREFERENCES_EVENT))}
      className="text-xs text-muted-foreground underline-offset-3 transition-colors hover:text-foreground hover:underline"
    >
      Cookie settings
    </button>
  )
}
