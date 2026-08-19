"use client";

import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import {
  OAuthProviderIcon,
  providerLabel,
  useConfiguredProviders,
} from "@/lib/oauth-providers";

export function OAuthButtons() {
  const t = useTranslations("common");
  const providers = useConfiguredProviders();

  // Loading: keep the row height so the form doesn't jump.
  if (!providers) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    );
  }

  if (providers.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {providers.map((p) => (
        <Button
          key={p.id}
          type="button"
          variant="outline"
          aria-label={t("continueWithProvider", { provider: p.label })}
          onClick={() => {
            void authClient.signIn.social({ provider: p.id });
          }}
        >
          <span data-icon="inline-start">
            <OAuthProviderIcon id={p.id} />
          </span>
          <span className="sr-only sm:not-sr-only">{providerLabel(p.id)}</span>
        </Button>
      ))}
    </div>
  );
}
