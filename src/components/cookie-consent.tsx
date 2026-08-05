"use client"

import { useEffect, useState } from "react"
import { CookieIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  COOKIE_PREFERENCES_EVENT,
  readConsent,
  writeConsent,
  type CookieConsentChoices,
} from "@/lib/consent"

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [prefsOpen, setPrefsOpen] = useState(false)
  const [prefs, setPrefs] = useState<CookieConsentChoices>({
    analytics: false,
    marketing: false,
  })

  useEffect(() => {
    // Check on mount only — the banner is purely client-side, so the server
    // render never shows it (no hydration mismatch).
    if (!readConsent()) setShowBanner(true)

    // Re-open preferences from anywhere (e.g. the footer "Cookie settings").
    const onOpen = () => openPreferences()
    window.addEventListener(COOKIE_PREFERENCES_EVENT, onOpen)
    return () => window.removeEventListener(COOKIE_PREFERENCES_EVENT, onOpen)
  }, [])

  // Always reflect the stored consent when opening the dialog — otherwise
  // saving could silently disable categories the user already accepted.
  function openPreferences() {
    const stored = readConsent()
    setPrefs({
      analytics: stored?.analytics ?? false,
      marketing: stored?.marketing ?? false,
    })
    setPrefsOpen(true)
  }

  function acceptAll() {
    writeConsent({ analytics: true, marketing: true })
    setShowBanner(false)
  }

  function essentialOnly() {
    writeConsent({ analytics: false, marketing: false })
    setShowBanner(false)
    setPrefsOpen(false)
  }

  function savePrefs() {
    writeConsent(prefs)
    setShowBanner(false)
    setPrefsOpen(false)
  }

  return (
    <>
      {showBanner && (
        <div
          role="region"
          aria-label="Cookie consent"
          className="fixed inset-x-0 bottom-0 z-40"
        >
          <div className="mx-auto w-full max-w-6xl px-4 pb-4 sm:px-6">
            <div className="rounded-xl border border-border bg-card p-4 shadow-lg animate-in slide-in-from-bottom-4 fade-in-0 duration-300 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3 sm:items-center">
                  <CookieIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground sm:mt-0" />
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    We use <span className="font-medium text-foreground">essential cookies</span>{" "}
                    to keep you signed in and remember your choices. We only use
                    analytics or marketing cookies if you allow them — you can
                    change this anytime.
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={openPreferences}>
                    Preferences
                  </Button>
                  <Button variant="outline" size="sm" onClick={essentialOnly}>
                    Essential only
                  </Button>
                  <Button size="sm" onClick={acceptAll}>
                    Accept all
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Dialog open={prefsOpen} onOpenChange={setPrefsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cookie preferences</DialogTitle>
            <DialogDescription>
              Essential cookies keep the app working. Analytics and marketing
              cookies are optional and only load if you allow them.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <label className="flex items-start justify-between gap-4">
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">Essential</span>
                <span className="text-xs leading-relaxed text-muted-foreground">
                  Keeps you signed in and remembers your consent. Always on.
                </span>
              </span>
              <input
                type="checkbox"
                checked
                disabled
                className="mt-1 size-4 shrink-0 accent-[var(--primary)] disabled:opacity-60"
                aria-label="Essential cookies (always on)"
              />
            </label>

            <label className="flex items-start justify-between gap-4">
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">Analytics</span>
                <span className="text-xs leading-relaxed text-muted-foreground">
                  Anonymous usage statistics that help us improve the product.
                </span>
              </span>
              <input
                type="checkbox"
                checked={prefs.analytics}
                onChange={(e) =>
                  setPrefs({ ...prefs, analytics: e.target.checked })
                }
                className="mt-1 size-4 shrink-0 accent-[var(--primary)]"
                aria-label="Analytics cookies"
              />
            </label>

            <label className="flex items-start justify-between gap-4">
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">Marketing</span>
                <span className="text-xs leading-relaxed text-muted-foreground">
                  Personalised offers and campaigns from our partners.
                </span>
              </span>
              <input
                type="checkbox"
                checked={prefs.marketing}
                onChange={(e) =>
                  setPrefs({ ...prefs, marketing: e.target.checked })
                }
                className="mt-1 size-4 shrink-0 accent-[var(--primary)]"
                aria-label="Marketing cookies"
              />
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={essentialOnly}>
              Essential only
            </Button>
            <Button onClick={savePrefs}>Save preferences</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
