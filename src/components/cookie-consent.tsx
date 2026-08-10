"use client";

import { useEffect, useState } from "react";
import { CookieIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  COOKIE_PREFERENCES_EVENT,
  readConsent,
  writeConsent,
  type CookieConsentChoices,
} from "@/lib/consent";

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [prefs, setPrefs] = useState<CookieConsentChoices>({
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Check on mount only - the banner is purely client-side, so the server
    // render never shows it (no hydration mismatch).
    if (!readConsent()) setShowBanner(true);

    // Re-open preferences from anywhere (e.g. the footer "Cookie settings").
    const onOpen = () => openPreferences();
    window.addEventListener(COOKIE_PREFERENCES_EVENT, onOpen);
    return () => window.removeEventListener(COOKIE_PREFERENCES_EVENT, onOpen);
  }, []);

  // Always reflect the stored consent when opening the dialog - otherwise
  // saving could silently disable categories the user already accepted.
  function openPreferences() {
    const stored = readConsent();
    setPrefs({
      analytics: stored?.analytics ?? false,
      marketing: stored?.marketing ?? false,
    });
    setPrefsOpen(true);
  }

  function acceptAll() {
    writeConsent({ analytics: true, marketing: true });
    setShowBanner(false);
  }

  function essentialOnly() {
    writeConsent({ analytics: false, marketing: false });
    setShowBanner(false);
    setPrefsOpen(false);
  }

  function savePrefs() {
    writeConsent(prefs);
    setShowBanner(false);
    setPrefsOpen(false);
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
            <div className="border-border bg-card animate-in slide-in-from-bottom-4 fade-in-0 rounded-xl border p-4 shadow-lg duration-300 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3 sm:items-center">
                  <CookieIcon className="text-muted-foreground mt-0.5 size-5 shrink-0 sm:mt-0" />
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    We use{" "}
                    <span className="text-foreground font-medium">
                      essential and technical cookies
                    </span>{" "}
                    to keep you signed in, remember your choices, and make the
                    app work. We only use analytics or marketing cookies if you
                    allow them - you can change this anytime.
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
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-0.5">
                <p id="cookie-essential-label" className="text-sm font-medium">
                  Essential
                </p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Keeps you signed in, remembers your consent, and keeps the app
                  working. Always on.
                </p>
              </div>
              <Switch
                checked
                disabled
                className="mt-1 shrink-0"
                aria-labelledby="cookie-essential-label"
              />
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-0.5">
                <p id="cookie-analytics-label" className="text-sm font-medium">
                  Analytics
                </p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Anonymous usage statistics that help us improve the product.
                </p>
              </div>
              <Switch
                checked={prefs.analytics}
                onCheckedChange={(checked) =>
                  setPrefs({ ...prefs, analytics: checked })
                }
                className="mt-1 shrink-0"
                aria-labelledby="cookie-analytics-label"
              />
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-0.5">
                <p id="cookie-marketing-label" className="text-sm font-medium">
                  Marketing
                </p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Personalised offers and campaigns from our partners.
                </p>
              </div>
              <Switch
                checked={prefs.marketing}
                onCheckedChange={(checked) =>
                  setPrefs({ ...prefs, marketing: checked })
                }
                className="mt-1 shrink-0"
                aria-labelledby="cookie-marketing-label"
              />
            </div>
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
  );
}
